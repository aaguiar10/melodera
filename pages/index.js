import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import HeadLayout from '../components/head-layout'
import styles from '../styles/Home.module.css'
import LogoPic from '../public/images/melodera-logo.png'
import Image from 'next/image'
import Link from 'next/link'
import { getProviders, signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'

// starting page
export default function Home ({ providers }) {
  return (
    <>
      <HeadLayout
        title='Melodera'
        description='Login page. Analyze songs, get recommendations, and view your listening habits'
      />
      <Container fluid>
        <Row className='mx-0 w-100 h-100 align-items-center justify-content-center top-50 start-50 translate-middle position-fixed'>
          <Col className='text-center'>
            <Row>
              <Col>
                <Image
                  className='img-fluid'
                  src={LogoPic}
                  alt='logo'
                  width={300}
                  height={300}
                  priority
                />
              </Col>
            </Row>
            <Row>
              <Col
                style={{
                  fontSize: 'x-large',
                  color: '#525366'
                }}
              >
                Learn about your listening habits, analyze songs, and more!
              </Col>
            </Row>
            <Row className='mt-4 gap-4 justify-content-center'>
              <div style={{ fontWeight: 500 }}>
                Currently available for Spotify Users
              </div>
              {Object.values(providers).map(provider => (
                <button
                  style={{ width: 'fit-content' }}
                  className={`${styles['btn']} ${styles['btn-sm']} ${styles['btn-green']}`}
                  onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                  key={provider.name}
                >
                  Get started
                </button>
              ))}
            </Row>
          </Col>
          <footer
            className='text-center mt-4 pt-4'
            style={{ borderTop: '1px solid lightgray' }}
          >
            Created by{' '}
            <Link
              className='link-secondary'
              href='https://www.linkedin.com/in/armani-aguiar/'
            >
              Armani Aguiar
            </Link>
          </footer>
        </Row>
      </Container>
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
