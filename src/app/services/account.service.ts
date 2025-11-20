import { Injectable } from '@angular/core';
import { MailAccount } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  async getAccounts(): Promise<MailAccount[]> {
    if (window.electronAPI) {
      return await window.electronAPI.getAccounts();
    }
    return [];
  }

  async saveAccount(account: MailAccount): Promise<boolean> {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.saveAccount(account);
      } catch (error) {
        console.error('Error saving account:', error);
        return false;
      }
    }
    console.error('Electron API not available');
    return false;
  }

  async deleteAccount(accountId: string): Promise<boolean> {
    if (window.electronAPI) {
      return await window.electronAPI.deleteAccount(accountId);
    }
    return false;
  }
}

