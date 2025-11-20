import { Injectable } from '@angular/core';
import { Email } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class MailService {
  async fetchEmails(accountId: string, folder: string = 'INBOX'): Promise<Email[]> {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.fetchEmails(accountId, folder);
      } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
      }
    }
    return [];
  }

  async getFolders(accountId: string): Promise<string[]> {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.getFolders(accountId);
      } catch (error) {
        console.error('Error fetching folders:', error);
        throw error;
      }
    }
    return [];
  }

  async sendEmail(accountId: string, to: string, subject: string, body: string, isHtml: boolean = false): Promise<boolean> {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.sendEmail(accountId, to, subject, body, isHtml);
      } catch (error) {
        console.error('Error sending email:', error);
        throw error;
      }
    }
    return false;
  }

  async deleteEmail(accountId: string, folder: string, emailUid: number): Promise<boolean> {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.deleteEmail(accountId, folder, emailUid);
      } catch (error) {
        console.error('Error deleting email:', error);
        throw error;
      }
    }
    return false;
  }
}

