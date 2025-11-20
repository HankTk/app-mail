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

