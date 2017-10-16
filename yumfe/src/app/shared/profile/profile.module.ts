import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { MatGridListModule, MatSelectModule , MatProgressBarModule, MatButtonModule, MatInputModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { HeaderModule } from '../header/header.module';
import { FooterModule } from '../footer/footer.module';
import { ProfileComponent, DeletePictureDialog } from '../profile/profile.component';
import { FileUploadModule } from 'ng2-file-upload';

@NgModule({
  imports: [CommonModule,  MatGridListModule, MatSelectModule, FormsModule, ReactiveFormsModule, FileUploadModule, MatProgressBarModule, MatButtonModule, MatInputModule ],
  declarations: [ ProfileComponent, DeletePictureDialog],  
  exports: [ProfileComponent]
})
export class ProfileModule {}