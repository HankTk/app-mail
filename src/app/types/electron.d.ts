export interface ElectronAPI {
  getAccounts: () => Promise<MailAccount[]>;
  saveAccount: (account: MailAccount) => Promise<boolean>;
  deleteAccount: (accountId: string) => Promise<boolean>;
  fetchEmails: (accountId: string, folder?: string) => Promise<Email[]>;
  getFolders: (accountId: string) => Promise<string[]>;
  sendEmail: (accountId: string, to: string, subject: string, body: string, isHtml?: boolean) => Promise<boolean>;
  deleteEmail: (accountId: string, folder: string, emailUid: number) => Promise<boolean>;
}

export interface MailAccount {
  id?: string;
  name: string;
  email: string;
  imap: {
    host: string;
    port: number;
    username: string;
    password: string;
    tls: boolean;
  };
  smtp: {
    host: string;
    port: number;
    username: string;
    password: string;
    tls: boolean;
  };
  folderOrder?: string[]; // フォルダーの表示順序
}

export interface Email {
  uid: number;
  subject: string;
  from: string;
  date: string;
  body: string;
  html?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

