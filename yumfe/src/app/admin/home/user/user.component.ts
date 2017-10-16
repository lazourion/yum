import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import * as remote from '../../../remote';
import { BASE_PATH } from '../../../remote/variables';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { AuthenticationService } from '../../../shared/authentication.service';
import { GlobalSettingsService } from '../../../shared/services/global-settings-service.service';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-admin-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  @Input() public user: remote.User;
  @Input() public externalAuth: Boolean = false;
  @Output() userDeleted = new EventEmitter();

  public currency: Observable<string>;
  public editRouterLink: string;

  public userId = this.authService.getLoggedInUser().id;
  public userPicture: string;
  public balance: number;

  constructor(private adminService: remote.AdminApi,
              public snackBar: MatSnackBar,
              public dialog: MatDialog,
              private authService: AuthenticationService,
              public globalSettingsService: GlobalSettingsService,
              @Inject(BASE_PATH) private baseUrl: string
              ) { }


  ngOnInit() {
    this.currency = this.globalSettingsService.getCurrency();
    if (this.user.id === this.userId){
      this.editRouterLink = '../settings/';
    } else {
      this.editRouterLink = 'users/' + this.user.id;
    }
    this.userPicture = this.baseUrl + '/users/' + this.user.id + '/picture/token?token=' + this.authService.getToken() ;
    if (this.user.balance == null) {
      this.balance = 0;
    } else {
      this.balance = this.user.balance;
    }
  }

  getUser() {
    return this.user;
  }

  // approve or disapprove user
  approve(event, aprv: boolean) {
    if (aprv) {
      this.adminService.usersIdApprovePut(this.user.id, aprv)
        .subscribe(
        value => {
          this.user.approved = true;
        },
        //error => console.log(error)
        );
    } else {
      this.adminService.usersIdApprovePut(this.user.id, aprv, false)
        .subscribe(
        value => {
          this.user.approved = false;
        },
        error => {
          if (error.status === 400) {
            event.source.checked = true;
          } else if (error.status === 409) {
            event.source.checked = true;
            // User has non final orders. Force disapprove?
            let dialogRef = this.dialog.open(UserListDisapproveDialog);
            dialogRef.afterClosed().subscribe(result => {

              if (result === 'Yes') {
                this.forceDisapprove();
              }
            });
          }
        });
    }
  }

  // Delete non fonal orders and diasapprove user
  private forceDisapprove() {
    this.adminService.usersIdApprovePut(this.user.id, false, true)
      .subscribe(
      value => {
        this.user.approved = false;
        // this.approvedText = 'User not approved';
      },
      //error => console.log(error)
      );
  }

  // Success and error snackbar
  private openSnackBar(message: string, action: string, timeOut: boolean) {
    if (timeOut) {
      this.snackBar.open(message, action, {
        duration: 5000,
        extraClasses: ['success-snack-bar']
      });
    } else {
      this.snackBar.open(message, action, {
        extraClasses: ['error-snack-bar']
      });
    }
  }

  private deleteUser() {
    this.adminService.usersIdDelete(this.user.id)
      .subscribe(
      result => {
        this.userDeleted.emit();
      },
      error => {
        switch (error.status) {
          // User has both final and non-final orders. Can be force disapproved
          case 402:
            let dialogRef = this.dialog.open(UserDelete402Dialog, {
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result === 'Yes') {
                this.forceDisapprove();
              }
            });
            break;
          // User has only non-final orders. Can be force deleted
          case 409:
            dialogRef = this.dialog.open(UserDelete409Dialog, {
            });
            dialogRef.afterClosed().subscribe(result => {
              if (result === 'Yes') {
                this.forceDelete();
              }
            });
            break;
          // User has only final orders. Can be disapproved
          case 412:
            if (this.user.approved) {
              dialogRef = this.dialog.open(UserDelete412Dialog, {
              });
              dialogRef.afterClosed().subscribe(result => {
                if (result === 'Yes') {
                  this.approve(event, false);
                }
              });
            //User already disapproved
            } else {
              dialogRef = this.dialog.open(UserDelete412DisapprovedDialog, {
              });
            }
            break;
          default:


        }
      }
      );
  }

  // delete non final orders and delete user
  private forceDelete() {
    this.adminService.usersIdDelete(this.user.id, true)
      .subscribe(
      result => {
        this.userDeleted.emit();
      },
      error => {
        this.openSnackBar('User can not be deleted!', 'ok', false);
      }
      );
  }

  // Dialog to confirm delete user
  deleteConfirm() {
    let dialogRef = this.dialog.open(UserDeleteConfirmDialog, {});
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.deleteUser();
      }
    });
  }

  public emailUserName(email: string): string {
    return email.substring(0, email.indexOf('@'));
  }
  public emailDomain(email: string): string {
    return '@' + email.split('@')[1];
  }

}



@Component({
  selector: 'app-admin-disapprove-dialog',
  templateUrl: './user-disapprove-dialog.html',
})
export class UserListDisapproveDialog {
  constructor(public dialogRef: MatDialogRef<UserListDisapproveDialog>) { }
}


@Component({
  selector: 'app-admin-delete-confirm-dialog',
  templateUrl: './user-delete-confirm-dialog.html',
})
export class UserDeleteConfirmDialog {
  constructor(public dialogRef: MatDialogRef<UserDeleteConfirmDialog>) { }
}

@Component({
  selector: 'app-admin-delete-402-dialog',
  templateUrl: './user-delete-402-dialog.html',
})
export class UserDelete402Dialog {
  constructor(public dialogRef: MatDialogRef<UserDelete402Dialog>) { }
}

@Component({
  selector: 'app-admin-delete-409-dialog',
  templateUrl: './user-delete-409-dialog.html',
})
export class UserDelete409Dialog {
  constructor(public dialogRef: MatDialogRef<UserDelete409Dialog>) { }
}

@Component({
  selector: 'app-admin-delete-412-dialog',
  templateUrl: './user-delete-412-dialog.html',
})
export class UserDelete412Dialog {
  constructor(public dialogRef: MatDialogRef<UserDelete412Dialog>) { }
}

@Component({
  selector: 'app-admin-delete-412-disapproved-dialog',
  templateUrl: './user-delete-412-disapproved-dialog.html',
})
export class UserDelete412DisapprovedDialog {
  constructor(public dialogRef: MatDialogRef<UserDelete412DisapprovedDialog>) { }
}
