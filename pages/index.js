import Image from 'next/image'
import styles from '../styles/Home.module.css'
import LogoPic from '../public/images/melodera-logo.png'
import Link from 'next/link'
import { useEffect } from 'react'
import HeadLayout from '../components/head-layout'
import { getProviders, signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'

export default function Home ({ providers }) {
  useEffect(() => {
    localStorage.setItem('beat_visualizer_state', JSON.stringify(false)) // default vis state
    localStorage.setItem('beat_visualizer_type', '') // default vis type
  }, [])

  return (
    <>
      <HeadLayout
        title='Melodera'
        description='Login page. Analyze songs, get recommendations, and view your listening habits'
      />
      <header>
        <h1>
          <Image
            className='img-fluid'
            id='login-logo'
            src={LogoPic}
            alt='logo'
            priority
          />
          Melodera
        </h1>
        <p style={{ fontSize: 'x-large', margin: '0 auto' }}>
          Learn about your listening habits, analyze songs, and more!
        </p>
      </header>
      <main>
        <div className='text-center'>
          <div className='fs-6 mt-2 mb-3' style={{ fontWeight: 500 }}>
            Currently available for Spotify Users
          </div>
          {Object.values(providers).map(provider => (
            <button
              id='login'
              className={`${styles['btn']} ${styles['btn-sm']} ${styles['btn-green']}`}
              onClick={() => signIn(provider.id, { callbackUrl: '/' })}
              key={provider.name}
            >
              Get started
            </button>
          ))}
        </div>
      </main>
      <footer className='text-center'>
        Created by{' '}
        <Link href='https://www.linkedin.com/in/armani-aguiar/'>
          Armani Aguiar
        </Link>
      </footer>
    </>
  )
}
export async function getServerSideProps (context) {
  const session = await getServerSession(context.req, context.res, authOptions)
  // If the user is already logged in, redirect.
  if (session) {
    return { redirect: { destination: '/analysis' } }
  }
  const providers = await getProviders()
  return {
    props: {
      providers
    }
  }
}
