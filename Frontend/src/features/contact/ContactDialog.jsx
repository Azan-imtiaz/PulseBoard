import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { CheckCircle2, Mail } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Field, Input, inputClass } from '@/components/Input';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSendContact } from './api';
import { closeContactDialog, useContactDialogOpen } from './store';

const MESSAGE_LIMIT = 5000;

export function ContactDialog() {
  const open = useContactDialogOpen();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const send = useSendContact();

  // Prefill from the signed-in account the moment the dialog opens with empty
  // fields. A signed-in visitor can still edit or send on someone else's behalf.
  useEffect(() => {
    if (open && user && !name && !email) {
      setName(user.name);
      setEmail(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onOpenChange(next) {
    closeContactDialog();
    if (!next) {
      // Let the close animation finish before the form resets under it.
      setTimeout(() => {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setSent(false);
        send.reset();
      }, 200);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    send.mutate(
      { name, email, subject, message },
      {
        onSuccess: () => setSent(true),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Contact the team"
      description="Questions, bugs, ideas — this goes straight to the people who built PulseBoard."
    >
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 py-6 text-center"
          >
            <CheckCircle2 className="size-8 text-ok" />
            <p className="text-sm font-medium text-fg">Message sent</p>
            <p className="max-w-[26ch] text-sm text-fg-muted">We'll get back to you soon.</p>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Your name">
                <Input
                  autoFocus
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </Field>
              <Field label="Your email">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </Field>
            </div>
            <Field label="Subject">
              <Input
                required
                maxLength={150}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
              />
            </Field>
            <Field label="Message" hint={`${message.length}/${MESSAGE_LIMIT}`}>
              <textarea
                required
                rows={5}
                maxLength={MESSAGE_LIMIT}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's going on…"
                className={cn(inputClass, 'h-auto min-h-28 resize-none py-2 leading-6')}
              />
            </Field>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="flex items-center gap-1.5 text-xs text-fg-faint">
                <Mail className="size-3.5" />
                We'll reply to the email above.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={send.isPending}>
                  Send message
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
