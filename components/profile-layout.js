import Modal from 'react-bootstrap/Modal'
import Card from 'react-bootstrap/Card'
import Image from 'next/image'
import DefaultPic from '../public/images/default_pic.png'
import { useContext, useState } from 'react'
import { AnalysisContext } from '../utils/context'

export default function ProfileLayout () {
  const [state] = useContext(AnalysisContext)
  const [show, setShow] = useState(false)

  return (
    <>
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Card>
            <Card.Body className='d-flex gap-3'>
              <Image
                src={state.profileInfo.profPic ?? DefaultPic}
                width={96}
                height={96}
                alt='Profile picture'
                className='rounded-circle'
                style={{ objectFit: 'cover' }}
              />
              <div>
                <h5 className='mb-2'>{state.profileInfo.displayName}</h5>
                <ul id='profInfoText' className='list-unstyled mb-0'>
                  <li>Country: {state.profileInfo.userCountry}</li>
                  <li>Subscription: {state.profileInfo.subscription}</li>
                  <li>Followers: {state.profileInfo.followersCount}</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Modal.Body>
      </Modal>

      {/* Hidden button to trigger modal from navbar */}
      <button
        id='profModal-trigger'
        className='d-none'
        onClick={() => setShow(true)}
      />
    </>
  )
}
