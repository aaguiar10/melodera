// Skeleton loader components for loading states
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'

// Skeleton card for track/artist/album items
export function SkeletonCard ({ count = 1 }) {
  return (
    <Container fluid>
      <Row className='gap-2'>
        <div className='searched'>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className='text-white-top skeleton-card'>
              <div className='card-image-wrapper'>
                <div className='skeleton skeleton-image' />
              </div>
              <div className='resultText'>
                <div className='skeleton skeleton-text skeleton-text-lg' />
                <div className='skeleton skeleton-text skeleton-text-md' />
              </div>
              <div className='skeleton skeleton-button' />
            </div>
          ))}
        </div>
      </Row>
    </Container>
  )
}

// Skeleton for mix/playlist items
export function SkeletonMixItem ({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='skeleton-mix-item'>
          <div className='skeleton skeleton-mix-image' />
          <div className='skeleton-mix-content'>
            <div className='skeleton skeleton-text skeleton-text-lg' />
            <div className='skeleton skeleton-text skeleton-text-md' />
          </div>
        </div>
      ))}
    </>
  )
}

// Simple inline skeleton text
export function SkeletonText ({ width = '100%', height = '1rem' }) {
  return (
    <div
      className='skeleton'
      style={{ width, height, display: 'inline-block' }}
    />
  )
}

// Default export with all variants
export default function SkeletonLoader ({ variant = 'card', count = 4 }) {
  switch (variant) {
    case 'card':
      return <SkeletonCard count={count} />
    case 'mix':
      return <SkeletonMixItem count={count} />
    default:
      return <SkeletonCard count={count} />
  }
}
