import {createContext,useContext,useState,useEffect,type ReactNode} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {siteContentSchema} from '@/lib/admin/schema';
import type {z} from 'zod';
const defaults=siteContentSchema.parse({});
const Content=createContext<z.infer<typeof siteContentSchema>>(defaults);
export function PublicContentProvider({children}:{children:ReactNode}){const [value,setValue]=useState(defaults);useEffect(()=>{let active=true;void supabase.from('website_content').select('published,published_at').eq('id',true).maybeSingle().then(({data})=>{const parsed=siteContentSchema.safeParse(data?.published??{});if(active&&parsed.success)setValue(parsed.data);});return()=>{active=false;};},[]);return <Content.Provider value={value}>{children}</Content.Provider>}
export function usePublicContent(){return useContext(Content);}
export function PublicAnnouncements(){const c=usePublicContent();return c.banner||c.announcement?<div className="public-announcement" role="status">{[c.banner,c.announcement].filter(Boolean).join(' · ')}</div>:null;}
export function PublishedContact(){const c=usePublicContent();return Object.values(c.contact).some(Boolean)?<dl className="published-contact">{Object.entries(c.contact).filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k==='hours'?'Operating hours':k}</dt><dd>{v}</dd></div>)}</dl>:<p>Official email, telephone, address and operating hours are awaiting verification. Please use this contact form in the meantime.</p>;}
export function PublishedCoverage(){const c=usePublicContent();return c.coverage.length?<div className="coverage-tags">{c.coverage.map(v=><span key={v}>{v}</span>)}</div>:null;}
export function PublishedReviews(){const c=usePublicContent();return c.testimonials.length?<div className="services-grid">{c.testimonials.map((r,i)=><article className="service-card" key={i}><strong>{r.name}</strong><small className="block text-muted-foreground">{r.location}</small><p className="mt-3">{'★'.repeat(r.rating)}</p><p>“{r.review}”</p></article>)}</div>:<div className="reviews-empty">Verified customer feedback will be shared here when available.</div>;}
