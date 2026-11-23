import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PasswordInput({ className = '', ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  const action = visible ? 'Hide password' : 'Show password';
  return <span className="relative mt-2 block">
    <input {...props} type={visible ? 'text' : 'password'} className={`!mt-0 !pr-12 ${className}`} />
    <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 my-auto !h-10 !w-10 text-muted-foreground" aria-label={action} title={action} aria-pressed={visible} onClick={() => setVisible(current => !current)}>
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </Button>
  </span>;
}