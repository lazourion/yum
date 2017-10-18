import { Component, OnInit, Inject, ViewChild, Optional } from '@angular/core';
import { Location } from '@angular/common';
import * as remote from '../../remote';
import { MatButtonModule, MatMenu, MatMenuTrigger } from '@angular/material';
import { AuthenticationService } from '../../shared/authentication.service';
import { BASE_PATH } from '../../remote/variables';
import { Router, ActivatedRoute, RouterLinkActive, NavigationEnd } from '@angular/router';
import { ControlUserService } from '../services/control-user.service';
import { BalanceService } from '../services/balance.service';
import { GlobalSettingsService } from '../../shared/services/global-settings-service.service';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

//import {EventSourcePolyfill} from 'ng-event-source';
import { EventSourcePolyfill } from 'ng-event-source';


import { Configuration } from '../../remote/configuration';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public user: remote.User;
  public role: string;
  public userPicture: string;
  public testClass: string = "MytestClass";
  public isOpen: boolean;
  public homepages: any[];
  public homepage: any[];
  public controlUser: remote.User;
  public balance: Observable<number>;
  public currency: Observable<string>;

  public configuration: Configuration = new Configuration();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger; //

  constructor(private authenticationService: AuthenticationService,
    @Inject(BASE_PATH) private baseUrl: string,
    private router: Router, private route: ActivatedRoute,
    private controlUserService: ControlUserService,
    private location: Location,
    private balanceService: BalanceService,
    private globalSettingsService: GlobalSettingsService,
    @Optional() configuration: Configuration
  ) {
    if (configuration) {
      this.configuration = configuration;
    }
  }

  ngOnInit() {

    this.user = this.authenticationService.getLoggedInUser();
    this.role = this.authenticationService.getLoggedInRole();

    this.controlUserService.getUser().subscribe(user => {
      this.controlUser = user;
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        //console.log(event);
        if (!event.url.startsWith('/hungry') && this.controlUser != null) {
          //console.log("Stop control");
          this.controlUserService.setUser(0);
          // console.log(this.location.path());
          // this.location.replaceState(this.location.path(), "");
        }
      }
    });

    this.route.queryParams.subscribe(params => {

      if (this.user && this.user.role == 'ADMIN') {
        let userid = +params['userid'] || 0;

        //comment if dont want to keep controlled user if no path query exists
        if (!userid) return;
        if (!this.controlUser) {
          this.controlUserService.setUser(userid);
        }
      }

    });





    this.userPicture = this.baseUrl + '/settings/picture/token?token=' + this.authenticationService.getToken();

    this.authenticationService.getObservableChange().subscribe(
      value => {
        this.userPicture = this.baseUrl + '/settings/picture/token?token=' + this.authenticationService.getToken() + "&change=" + value;
        this.user = this.authenticationService.getLoggedInUser();
      }
    );
    //this.userPicture = this.baseUrl + '/settings/picture/token?token='+this.authenticationService.getToken();
    // setPositionClasses
    this.setDestinations();
    this.isOpen = this.trigger.menuOpen;


    this.balance = this.balanceService.getBalance();

    // event source for balance updates with authorization token in headers
    const source = new EventSourcePolyfill(
      'http://localhost:8080/api/balanceSse',
      { headers: { 'Authorization': this.configuration.apiKey } });

    source.onmessage = (balance => {
      this.balanceService.updateBalance(JSON.parse(balance.data));
    });


    this.currency = this.globalSettingsService.getCurrency();

  }

  getUser() {
    return this.user;
  }
  logOff() {
    this.authenticationService.logout();
    this.router.navigate(['/']);
  }

  triggerMenu() {
    this.trigger.openMenu();
  }


  setDestinations() {
    if (this.user.role == 'admin') {
      this.homepages = [{ display: "Hungry home page", destination: "hungry" },
      { display: "Chef home page", destination: "chef" },
      { display: "Admin home page", destination: "admin" }
      ];
    }
    else if (this.user.role == 'chef') {
      this.homepages = [{ display: "Hungry home page", destination: "hungry" },
      { display: "Chef home page", destination: "chef" }
      ];
    }

  }

  public goToHomepage(homepage) {

    if (homepage != null) {
      switch (homepage.destination) {
        case 'admin':
          this.router.navigate(['admin']);
          break;
        case 'hungry':
          this.router.navigate(['hungry']);
          break;
        case 'chef':
          this.router.navigate(['chef']);
          break;
      }
    }
  }

  exitControlUser() {

    this.controlUserService.setUser(0);
    this.router.navigate(['/hungry']);
  }

}
