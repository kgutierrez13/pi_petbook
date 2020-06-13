import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';


//Componentes

import { LoginComponent } from './components/login/login.component'; 
import { RegisterComponent } from './components/register/register.component'; 
import { HomeComponent } from './components/home/home.component';

const appRoutes: Routes = [
	{path: '', component: HomeComponent},
	{path: 'home', component: HomeComponent},
	{path: 'login', component: LoginComponent},
	{path: 'registro', component: RegisterComponent}
];


export const appRoutingProviders: any[] = []; 
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);

