import { from } from 'node-vibrant'
export default async function handler (req, res) {
  // Get Image Colors
  if (req.headers?.authorization) {
    var img = req.query.img
    await from(img)
      .getPalette()
      .then(palette => res.status(200).json(palette))
      .catch(error => {
        console.log(error)
        res.status(500).send(error)
      })
  } else {
    res.status(401).send({ error: 'No token provided' })
  }
}
