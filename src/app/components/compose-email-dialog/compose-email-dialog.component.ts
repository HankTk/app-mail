import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MailService } from '../../services/mail.service';
import { AccountService } from '../../services/account.service';
import { MailAccount } from '../../models/account.model';

@Component({
  selector: 'app-compose-email-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>メール作成</h2>
    <mat-dialog-content>
      <form #composeForm="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>送信元アカウント</mat-label>
          <mat-select [(ngModel)]="selectedAccountId" name="account" required>
            <mat-option *ngFor="let account of accounts" [value]="account.id">
              {{ account.name }} ({{ account.email }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>宛先</mat-label>
          <input matInput [(ngModel)]="email.to" name="to" required placeholder="example@email.com, another@email.com">
          <mat-hint>複数の宛先はカンマで区切ってください</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>件名</mat-label>
          <input matInput [(ngModel)]="email.subject" name="subject" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>本文</mat-label>
          <textarea matInput [(ngModel)]="email.body" name="body" rows="10" required></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-raised-button color="primary" type="button" (click)="send()" [disabled]="!composeForm?.valid || sending">
        <span *ngIf="!sending">送信</span>
        <span *ngIf="sending">送信中...</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 600px;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 10px;
    }
    
    textarea {
      min-height: 200px;
    }
  `]
})
export class ComposeEmailDialogComponent implements OnInit {
  @ViewChild('composeForm') composeForm!: NgForm;
  accounts: MailAccount[] = [];
  selectedAccountId: string | null = null;
  sending: boolean = false;
  email = {
    to: '',
    subject: '',
    body: ''
  };

  constructor(
    public dialogRef: MatDialogRef<ComposeEmailDialogComponent>,
    private mailService: MailService,
    private accountService: AccountService
  ) {}

  async ngOnInit() {
    await this.loadAccounts();
    if (this.accounts.length > 0) {
      this.selectedAccountId = this.accounts[0].id || null;
    }
  }

  async loadAccounts() {
    this.accounts = await this.accountService.getAccounts();
  }

  async send() {
    if (!this.composeForm || !this.composeForm.valid || !this.selectedAccountId) {
      alert('すべての必須項目を入力してください。');
      return;
    }

    if (!this.email.to || !this.email.subject || !this.email.body) {
      alert('宛先、件名、本文をすべて入力してください。');
      return;
    }

    this.sending = true;
    try {
      const success = await this.mailService.sendEmail(
        this.selectedAccountId,
        this.email.to,
        this.email.subject,
        this.email.body,
        false
      );
      
      if (success) {
        this.dialogRef.close(true);
      } else {
        alert('メールの送信に失敗しました。');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('メールの送信中にエラーが発生しました: ' + (error as Error).message);
    } finally {
      this.sending = false;
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}

