import Image from 'next/image'
import DefaultPic from '../public/images/default_pic.png'

// component for profile modal
export default function ProfileLayout ({ profileInfo }) {
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
              {profileInfo.length === 0 ? (
                '...'
              ) : (
                <div className='card' style={{ maxWidth: '540px' }}>
                  <div className='row g-0'>
                    <div className='col-sm-4 text-center'>
                      <Image
                        src={
                          profileInfo['prof_pic'] !== ''
                            ? profileInfo['prof_pic']
                            : DefaultPic
                        }
                        className='img-fluid rounded-start'
                        style={{ objectFit: 'contain' }}
                        alt='Profile Pic'
                        width={300}
                        height={300}
                      />
                    </div>
                    <div className='col-sm-8'>
                      <div className='card-body text-center'>
                        <h5 className='card-title'>
                          {profileInfo['displayName']}
                        </h5>
                        <ul className='card-text' id='profInfoText'>
                          <li>Country: {profileInfo['userCountry']}</li>
                          <li>Subscription: {profileInfo['subLevel']}</li>
                          <li>Followers: {profileInfo['followersCount']}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
