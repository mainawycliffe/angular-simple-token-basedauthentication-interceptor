import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/catch';

import { AuthService } from './../services/auth/auth.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private inj: Injector, private router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        let authService = this.inj.get(AuthService); //authservice is an angular service  

        // Get the auth header from the service.
        const Authorization = authService.getToken();

        // Clone the request to add the new header.
        const authReq = req.clone({ headers: req.headers.set('authorization', Authorization) });
        // Pass on the cloned request instead of the original request.
        return next.handle(authReq)
            .catch((error, caught) => {

                if (error.status === 401) {
                    //logout users, redirect to login page
                    authService.removeTokens();
                    this.router.navigate(['/public']);
                    return Observable.throw(error);

                }

                if (error.status === 419) {

                    return authService.refreshToken().flatMap(t => {
                        const authReq = req.clone({ headers: req.headers.set('authorization', t) });
                        return next.handle(authReq);
                    });

                }

                //return all others errors 
                return Observable.throw(error);

            }) as any;
    }
}
