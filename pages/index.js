import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Stack from 'react-bootstrap/Stack'
import HeadLayout from '../components/head-layout'
import styles from '../styles/Home.module.css'
import LogoPic from '../public/images/melodera-logo.png'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './api/auth/[...nextauth]'

const PrivacyPolicyModal = ({ show, handleClose }) => (
  <Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>Privacy Policy</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>Last updated: [2024-04-30]</p>

      <h5>What information is collected?</h5>
      <p>
        When you use Melodera, it collects some info about you from Spotify:
      </p>
      <ul>
        <li>Your email</li>
        <li>Your name, username, profile picture, and Spotify followers</li>
        <li>Your Spotify subscription type and country</li>
        <li>Your followed artists</li>
        <li>Your top artists and content</li>
        <li>Your public, private, and collaborative playlists</li>
        <li>The saved content in Your Library</li>
        <li>The content you&apos;re playing and Spotify Connect devices</li>
      </ul>

      <h5>How does it use this information?</h5>
      <p>
        Melodera respects your privacy. You can view its Spotify scope from the
        source code{' '}
        <Link href='https://github.com/aaguiar10/melodera/blob/main/pages/api/auth/%5B...nextauth%5D.js'>
          here
        </Link>
        . It uses this info to:
      </p>
      <ul>
        <li>Provide you with access to Melodera</li>
        <li>Personalize your experience</li>
        <li>Create and edit playlists</li>
        <li>Add and remove Liked Songs from Your Library</li>
        <li>Make recommendations</li>
        <li>Play music with Melodera&apos;s player</li>
      </ul>
      <p>
        Your information is not used for anything other than providing and
        improving the application
      </p>
    </Modal.Body>
  </Modal>
)

// starting page
export default function Home () {
  const [show, setShow] = useState(false)

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <HeadLayout
        title='Melodera'
        description='Login page. Analyze songs, get recommendations, and discover your listening trends'
      />
      <Container fluid className='d-flex flex-column min-vh-100'>
        <PrivacyPolicyModal show={show} handleClose={handleClose} />
        <Stack className='flex-grow-1 text-center justify-content-center align-items-center'>
          <Row className='gap-4 justify-content-center px-3'>
            <Col xs={12} className='d-flex justify-content-center'>
              <Image
                className='img-fluid'
                src={LogoPic}
                alt='logo'
                width={280}
                height={280}
                priority
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.3))'
                }}
              />
            </Col>
            <Col xs={12}>
              <h1
                className='mb-3'
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 700,
                  background:
                    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.025em'
                }}
              >
                Discover Your Music DNA
              </h1>
              <p
                style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                  color: '#94a3b8',
                  maxWidth: '500px',
                  margin: '0 auto 1.5rem',
                  lineHeight: 1.6
                }}
              >
                Uncover insights through your listening trends, song analysis,
                and personalized recommendations
              </p>
            </Col>
            <Col xs={12}>
              <span
                className='d-inline-block mb-3 px-3 py-1'
                style={{
                  fontWeight: 500,
                  color: '#64748b',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Currently available for Spotify Users
              </span>
            </Col>
            <Col xs={12}>
              <Button
                style={{ width: 'fit-content', minWidth: '200px' }}
                className={`${styles['btn-purple']} px-5 py-2`}
                onClick={() => signIn('spotify', { callbackUrl: '/analysis' })}
              >
                <i className='bi bi-spotify me-2'></i>
                Get Started
              </Button>
            </Col>
          </Row>
        </Stack>
        <footer>
          <Stack className='d-flex flex-column flex-md-row align-items-center justify-content-center gap-2 py-4'>
            <div className='d-flex gap-2'>
              <Button
                className='p-2'
                variant='link'
                href='https://www.linkedin.com/in/armani-aguiar/'
                style={{
                  color: '#64748b',
                  transition: 'all 200ms ease',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = '#6366f1'
                  e.currentTarget.style.borderColor = '#6366f1'
                  e.currentTarget.style.boxShadow =
                    '0 0 20px rgba(99, 102, 241, 0.3)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = '#64748b'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <i className='bi bi-linkedin fs-5' />
              </Button>
              <Button
                className='p-2'
                variant='link'
                href='https://github.com/aaguiar10'
                style={{
                  color: '#64748b',
                  transition: 'all 200ms ease',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = '#6366f1'
                  e.currentTarget.style.borderColor = '#6366f1'
                  e.currentTarget.style.boxShadow =
                    '0 0 20px rgba(99, 102, 241, 0.3)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = '#64748b'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <i className='bi bi-github fs-5' />
              </Button>
            </div>
            <div className='d-flex justify-content-end align-items-center'>
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                © 2024 Melodera
              </span>
              <Button
                className='text-decoration-none'
                variant='link'
                onClick={handleShow}
                style={{
                  color: '#94a3b8',
                  transition: 'color 200ms ease'
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#6366f1')}
                onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                Privacy Policy
              </Button>
            </div>
          </Stack>
        </footer>
      </Container>
    </>
  )
}

export async function getServerSideProps (context) {
  try {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions
    )
    // If the user is already logged in, redirect.
    if (session) {
      return { redirect: { destination: '/analysis' } }
    }
    return {
      props: {}
    }
  } catch (err) {
    console.error(err)
    return {
      props: {}
    }
  }
}
