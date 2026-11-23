import {useEffect,useState} from 'react';
import {useRouterState} from '@tanstack/react-router';
import logo from '@/assets/swift-company-logo.asset.json';
export function BrandLoading(){return <div className="brand-loading" role="status" aria-label="Swift Delivery Express page loading"><img src={logo.url} alt="Swift Delivery Express"/><span className="brand-loading-line"/><span className="sr-only">Loading page…</span></div>}
export function PageLoadingScreen(){const [initial,setInitial]=useState(true);const loading=useRouterState({select:s=>s.isLoading});useEffect(()=>{const timer=setTimeout(()=>setInitial(false),550);return()=>clearTimeout(timer);},[]);return initial||loading?<BrandLoading/>:null;}