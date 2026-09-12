import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
export const metadata:Metadata={title:'AxomPrep | Learn. Practice. Prepare.',description:'AxomPrep is an Assam-focused learning platform providing accessible study materials, practice resources, mock tests, current affairs and exam-focused content for students and competitive-exam aspirants.',icons:{icon:'/logo.svg'},openGraph:{title:'AxomPrep | Learn. Practice. Prepare.',description:'Assam-focused learning and exam preparation.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/><main>{children}</main><Footer/></body></html>}
