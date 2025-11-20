const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || 
              process.env.npm_lifecycle_event === 'electron-dev' ||
              process.argv.includes('--dev');

let mainWindow;

// アカウント設定の保存先
const accountsFilePath = path.join(app.getPath('userData'), 'accounts.json');

function loadAccounts() {
  try {
    if (fs.existsSync(accountsFilePath)) {
      return JSON.parse(fs.readFileSync(accountsFilePath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading accounts:', error);
  }
  return [];
}

function saveAccounts(accounts) {
  try {
    // Ensure the directory exists
    const accountsDir = path.dirname(accountsFilePath);
    if (!fs.existsSync(accountsDir)) {
      fs.mkdirSync(accountsDir, { recursive: true });
    }
    fs.writeFileSync(accountsFilePath, JSON.stringify(accounts, null, 2), 'utf8');
    console.log('Accounts saved successfully to:', accountsFilePath);
    return true;
  } catch (error) {
    console.error('Error saving accounts:', error);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    titleBarStyle: 'default',
    show: false
  });

  if (isDev) {
    console.log('Loading development server at http://localhost:4200');
    const loadDevServer = () => {
      mainWindow.loadURL('http://localhost:4200').catch(err => {
        console.log('Failed to load dev server, retrying in 2 seconds...', err.message);
        setTimeout(loadDevServer, 2000);
      });
    };
    loadDevServer();
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/app-mail/browser/index.html');
    console.log('Loading production file:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    if (isDev && validatedURL.includes('localhost:4200')) {
      console.log('Retrying to load development server...');
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:4200');
      }, 2000);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-accounts', () => {
  return loadAccounts();
});

ipcMain.handle('save-account', (event, account) => {
  try {
    console.log('Saving account:', account);
    const accounts = loadAccounts();
    const existingIndex = accounts.findIndex(a => a.id === account.id);
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
      console.log('Updating existing account at index:', existingIndex);
    } else {
      if (!account.id) {
        account.id = Date.now().toString();
      }
      accounts.push(account);
      console.log('Adding new account with id:', account.id);
    }
    
    const result = saveAccounts(accounts);
    console.log('Save result:', result);
    return result;
  } catch (error) {
    console.error('Error in save-account handler:', error);
    return false;
  }
});

ipcMain.handle('delete-account', (event, accountId) => {
  const accounts = loadAccounts();
  const filtered = accounts.filter(a => a.id !== accountId);
  return saveAccounts(filtered);
});

ipcMain.handle('fetch-emails', async (event, accountId, folder = 'INBOX') => {
  const accounts = loadAccounts();
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) {
    throw new Error('Account not found');
  }

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.imap.username,
      password: account.imap.password,
      host: account.imap.host,
      port: account.imap.port || 993,
      tls: account.imap.tls !== false,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        imap.search(['ALL'], (err, results) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          const fetch = imap.fetch(results.slice(-50), { bodies: '' });
          const emailPromises = [];

          fetch.on('message', (msg, seqno) => {
            const emailPromise = new Promise((resolveEmail) => {
              let emailData = {
                uid: seqno,
                subject: '',
                from: '',
                date: '',
                body: '',
                html: ''
              };

              let buffer = '';
              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
                stream.on('end', () => {
                  simpleParser(buffer).then(parsed => {
                    emailData.subject = parsed.subject || '(No Subject)';
                    emailData.from = parsed.from?.text || 'Unknown';
                    emailData.date = parsed.date?.toISOString() || new Date().toISOString();
                    emailData.body = parsed.text || '';
                    emailData.html = parsed.html || '';
                  }).catch(err => {
                    console.error('Error parsing email:', err);
                    emailData.subject = '(Parse Error)';
                    emailData.body = 'Failed to parse email';
                  });
                });
              });

              msg.once('attributes', (attrs) => {
                emailData.uid = attrs.uid;
              });

              msg.once('end', () => {
                // パースが完了するまで少し待つ
                setTimeout(() => {
                  resolveEmail(emailData);
                }, 100);
              });
            });
            emailPromises.push(emailPromise);
          });

          fetch.once('end', async () => {
            try {
              const emails = await Promise.all(emailPromises);
              imap.end();
              resolve(emails.reverse());
            } catch (err) {
              imap.end();
              reject(err);
            }
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
});

ipcMain.handle('get-folders', async (event, accountId) => {
  const accounts = loadAccounts();
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) {
    throw new Error('Account not found');
  }

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.imap.username,
      password: account.imap.password,
      host: account.imap.host,
      port: account.imap.port || 993,
      tls: account.imap.tls !== false,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          imap.end();
          reject(err);
          return;
        }

        const folders = [];
        function traverseBoxes(boxes, prefix = '') {
          for (const boxName in boxes) {
            const box = boxes[boxName];
            const fullName = prefix ? `${prefix}${box.delimiter}${boxName}` : boxName;
            folders.push(fullName);
            if (box.children) {
              traverseBoxes(box.children, fullName);
            }
          }
        }
        traverseBoxes(boxes);
        
        imap.end();
        resolve(folders);
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
});

ipcMain.handle('delete-email', async (event, accountId, folder, emailUid) => {
  console.log('delete-email handler called:', { accountId, folder, emailUid });
  
  const accounts = loadAccounts();
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) {
    throw new Error('Account not found');
  }

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.imap.username,
      password: account.imap.password,
      host: account.imap.host,
      port: account.imap.port || 993,
      tls: account.imap.tls !== false,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          console.error('Error opening box:', err);
          imap.end();
          reject(err);
          return;
        }

        // Convert emailUid to number if it's a string
        const uid = typeof emailUid === 'string' ? parseInt(emailUid, 10) : emailUid;
        
        if (isNaN(uid)) {
          console.error('Invalid email UID:', emailUid);
          imap.end();
          reject(new Error('Invalid email UID'));
          return;
        }

        console.log('Adding DELETE flag to UID:', uid);

        // Add DELETE flag to the email using UID
        imap.addFlags(uid, '\\Deleted', (err) => {
          if (err) {
            console.error('Error adding DELETE flag:', err);
            imap.end();
            reject(err);
            return;
          }

          console.log('DELETE flag added, expunging...');

          // Expunge to actually delete the email
          imap.expunge((err) => {
            if (err) {
              console.error('Error expunging:', err);
              imap.end();
              reject(err);
              return;
            }

            imap.end();
            console.log('Email deleted successfully:', uid);
            resolve(true);
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      reject(err);
    });

    imap.connect();
  });
});

ipcMain.handle('send-email', async (event, accountId, to, subject, body, isHtml = false) => {
  const accounts = loadAccounts();
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) {
    throw new Error('Account not found');
  }

  try {
    console.log('Sending email from account:', account.email);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('SMTP Host:', account.smtp.host);
    console.log('SMTP Port:', account.smtp.port);
    console.log('SMTP TLS:', account.smtp.tls);

    const port = account.smtp.port || 465;
    const useTLS = account.smtp.tls !== false;
    
    // Port 465 typically uses direct SSL/TLS (secure: true)
    // Port 587 typically uses STARTTLS (secure: false, requireTLS: true)
    // Port 25 typically uses no encryption or STARTTLS
    let secure = false;
    let requireTLS = false;
    
    if (port === 465) {
      // Port 465: Use direct SSL/TLS connection
      secure = useTLS;
    } else if (port === 587) {
      // Port 587: Use STARTTLS (upgrade from plain to TLS)
      secure = false;
      requireTLS = useTLS;
    } else {
      // For other ports, default to secure if TLS is enabled
      secure = useTLS;
    }

    const transporterConfig = {
      host: account.smtp.host,
      port: port,
      secure: secure,
      auth: {
        user: account.smtp.username,
        pass: account.smtp.password
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    };

    // Only set requireTLS if we're using STARTTLS (port 587)
    if (requireTLS) {
      transporterConfig.requireTLS = true;
    }

    console.log('Transporter config:', {
      host: transporterConfig.host,
      port: transporterConfig.port,
      secure: transporterConfig.secure,
      requireTLS: transporterConfig.requireTLS
    });

    const transporter = nodemailer.createTransport(transporterConfig);

    const mailOptions = {
      from: `"${account.name}" <${account.email}>`,
      to: to,
      subject: subject,
      text: isHtml ? undefined : body,
      html: isHtml ? body : undefined
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

