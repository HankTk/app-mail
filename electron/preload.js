const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccount: (account) => ipcRenderer.invoke('save-account', account),
  deleteAccount: (accountId) => ipcRenderer.invoke('delete-account', accountId),
  fetchEmails: (accountId, folder) => ipcRenderer.invoke('fetch-emails', accountId, folder),
  getFolders: (accountId) => ipcRenderer.invoke('get-folders', accountId),
  sendEmail: (accountId, to, subject, body, isHtml) => ipcRenderer.invoke('send-email', accountId, to, subject, body, isHtml),
  deleteEmail: (accountId, folder, emailUid) => ipcRenderer.invoke('delete-email', accountId, folder, emailUid)
});

