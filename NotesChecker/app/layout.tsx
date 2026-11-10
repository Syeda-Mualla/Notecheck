import type {Metadata} from 'next'
import './globals.css'
export const metadata:Metadata={title:'Noteschecker — Goals, notes and review',description:'A workspace for client goals, daily note drafts, review and Google Docs export.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
