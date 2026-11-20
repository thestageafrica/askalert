import type { InvolvementMode } from './types';

export const involvementOptions: ReadonlyArray<{
  id: InvolvementMode;
  title: string;
  label: string;
  blurb: string;
}> = [
  {
    id: 'match',
    title: 'Find only',
    label: 'Match',
    blurb: 'AskAlert finds vendors. You handle the rest.',
  },
  {
    id: 'relay',
    title: 'Chat through AskAlert',
    label: 'Relay',
    blurb: 'Messages stay inside AskAlert until you book.',
  },
  {
    id: 'assist',
    title: 'Help me reply',
    label: 'Assist',
    blurb: 'AskAlert drafts replies. You approve before send.',
  },
  {
    id: 'autopilot',
    title: 'Negotiate for me',
    label: 'Autopilot',
    blurb: 'AskAlert negotiates within your rules and brings back the best.',
  },
];
