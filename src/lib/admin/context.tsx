import {createContext,useContext,type ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useServerFn} from '@tanstack/react-start';
import {getAdminData,getOperationalStats} from './admin.functions';
export type AdminData=Awaited<ReturnType<typeof getAdminData>>;
export type SessionSettings={currency:string;timezone:string;idle_minutes:number;require_mfa:boolean;notification_preferences:unknown};
const Context=createContext<{data:AdminData;stats:unknown;refresh:()=>Promise<void>;email:string;page:number;setPage:(page:number)=>void}|null>(null);
export function AdminDataProvider({children,email,page,setPage}:{children:ReactNode;email:string;page:number;setPage:(page:number)=>void}){const load=useServerFn(getAdminData);const statsFn=useServerFn(getOperationalStats);const q=useQuery({queryKey:['admin-data',page],queryFn:()=>load({data:{page}}),refetchOnWindowFocus:false});const stats=useQuery({queryKey:['admin-stats'],queryFn:()=>statsFn(),refetchOnWindowFocus:false});if(q.isPending)return <div className="admin-loading" role="status">Loading operational records…</div>;if(q.error||!q.data)return <div className="admin-error" role="alert">{q.error?.message??'Records are unavailable.'}</div>;return <Context.Provider value={{data:q.data,stats:stats.data,refresh:async()=>{await Promise.all([q.refetch(),stats.refetch()]);},email,page,setPage}}>{children}</Context.Provider>}
export function useAdmin(){const value=useContext(Context);if(!value)throw new Error('Administrator data is unavailable.');return value;}
