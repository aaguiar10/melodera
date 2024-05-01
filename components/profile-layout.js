import DefaultPic from '../public/images/default_pic.png'
import Image from 'next/image'
import { useContext } from 'react'
import { AnalysisContext } from '../utils/context'

// component for profile modal
export default function ProfileLayout () {
  const [state] = useContext(AnalysisContext)
  const renderProfileInfo = () => {
    if (state.profileInfo.length === 0) {
      return '...'
    }
    return (
      <article className='card' style={{ maxWidth: '540px' }}>
        <div className='row g-0'>
          <div className='col-sm-4 text-center'>
            <Image
              src={state.profileInfo.profPic ?? DefaultPic}
              className='img-fluid rounded-start'
              style={{ objectFit: 'contain' }}
              alt='Profile Pic'
              width={300}
              height={300}
            />
          </div>
          <div className='col-sm-8'>
            <div className='card-body text-center'>
              <h5 className='card-title'>{state.profileInfo.displayName}</h5>
              <ul className='card-text' id='profInfoText'>
                <li>Country: {state.profileInfo.userCountry}</li>
                <li>Subscription: {state.profileInfo.subscription}</li>
                <li>Followers: {state.profileInfo.followersCount}</li>
              </ul>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <>
      <div
        className='modal fade'
        id='profModal'
        tabIndex='-1'
        aria-labelledby='profModalLabel'
        aria-hidden='true'
      >
        <div className='modal-dialog modal-dialog-centered'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title' id='profModalTitle'>
                Profile
              </h5>
              <button
                type='button'
                className='btn-close'
                data-bs-dismiss='modal'
                aria-label='Close'
              ></button>
            </div>
            <div className='modal-body' id='profModalBody'>
              {renderProfileInfo()}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
