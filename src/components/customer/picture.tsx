import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export function CustomerPicture({path}: {path: string}) {
  const {data}=useQuery({queryKey:['customer-picture',path],enabled:Boolean(path),queryFn:async()=>{const bucket=path.startsWith('documents/')?'admin-documents':'customer-pictures';const result=await supabase.storage.from(bucket).createSignedUrl(path,120);return result.data?.signedUrl ?? '';},staleTime:60000,refetchInterval:60000});
  return data?<img className="customer-picture-thumb" src={data} alt="Customer profile"/>:<span className="mini-avatar"><UserRound size={14}/></span>;
}