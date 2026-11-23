import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {toast} from 'sonner';
import {isLanguageCode,type LanguageCode} from './languages';
const localeFiles=import.meta.glob<Record<string,string>>('./locales/*.json',{import:'default'});
const extraFiles=import.meta.glob<Record<string,string>>('./locale-extras/*.json',{import:'default'});
const LanguageContext=createContext({language:'en' as LanguageCode,busy:false,change:(_code:LanguageCode)=>{}});
export function useLanguage(){return useContext(LanguageContext)}
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,setLanguage]=useState<LanguageCode>('en');const [busy,setBusy]=useState(false);const [dictionary,setDictionary]=useState<Record<string,string>>({});
 const root=useRef<HTMLDivElement>(null);const original=useRef(new WeakMap<Text,{source:string;rendered:string}>());const attributes=useRef(new WeakMap<Element,Map<string,{source:string;rendered:string}>>());const generation=useRef(0);
 async function change(code:LanguageCode){const request=++generation.current;setBusy(true);try{const load=localeFiles[`./locales/${code}.json`];const next=code==='en'?{}:load?await load():null;if(!next)throw new Error('Translation unavailable');if(request!==generation.current)return;const extra=extraFiles[`./locale-extras/extra-${code}.json`];const additional=extra?await extra():{};if(request!==generation.current)return;setDictionary({...next,...additional});setLanguage(code);localStorage.setItem('swift-language',code);document.documentElement.lang=code;}catch{toast.error('This language could not be loaded. Please try again.');}finally{if(request===generation.current)setBusy(false);}}
 useEffect(()=>{const stored=localStorage.getItem('swift-language');if(stored&&isLanguageCode(stored))void change(stored);},[]);
 useEffect(()=>{const node=root.current;if(!node)return;let queued=false;
  const translate=(source:string)=>{const key=source.replace(/\s+/g,' ').trim();const value=dictionary[key];return value?`${source.match(/^\s*/)?.[0]??''}${value}${source.match(/\s*$/)?.[0]??''}`:source;};
  const skip=(element:Element)=>Boolean(element.closest('[data-no-translate],script,style,textarea,.booking-history,.tracking-result,.admin-app'));
  const apply=()=>{observer.disconnect();const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let item=walker.nextNode();while(item){if(item instanceof Text&&item.parentElement&&!skip(item.parentElement)){const prev=original.current.get(item);const source=prev&&item.data===prev.rendered?prev.source:item.data;const rendered=translate(source);if(item.data!==rendered)item.data=rendered;original.current.set(item,{source,rendered});}item=walker.nextNode();}
   node.querySelectorAll('[placeholder],[aria-label],[alt]').forEach(element=>{if(skip(element))return;let map=attributes.current.get(element);if(!map){map=new Map();attributes.current.set(element,map);}for(const key of ['placeholder','aria-label','alt']){const current=element.getAttribute(key);if(!current)continue;const prev=map.get(key);const source=prev&&prev.rendered===current?prev.source:current;const rendered=translate(source);if(current!==rendered)element.setAttribute(key,rendered);map.set(key,{source,rendered});}});
   observer.observe(node,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','alt']});};
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;if(node.isConnected)apply();});});apply();return()=>observer.disconnect();
 },[dictionary]);
 return <LanguageContext.Provider value={{language,busy,change:code=>{void change(code);}}}><div ref={root} className="public-language-shell">{children}</div></LanguageContext.Provider>;
}