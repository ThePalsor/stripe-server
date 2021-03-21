const express = require('express');
const app = express();
const stripe = require('stripe')('sk_test_51IWMLVB0L4ACn1yoeeG9u33gdnBewFsw9gn1B9h4SqlBIqdo8T3YdhGNRY2gpSm56wbgybLFZnUHRctSx4fxaOah000Ut5MRef');
const soap = require('soap');

var cors = require('cors');

app.use(cors({ origin: '*' }));
app.use(express.json());

async function getDeliveryFees(soap_args) {
  return new Promise((resolve, reject) => {
    soap.createClient("http://blooming-mountain-84082.herokuapp.com/?wsdl", (err, client) => {
      client.compute_fees(soap_args, (err, result, body) => {
        const fees = result.compute_feesResult;
        return resolve(fees)
      })
    });
  });
}

async function getCheckoutSession(products, origin) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    locale: 'fr',
    line_items: products,
    mode: 'payment',
    success_url: origin,
    cancel_url: origin,
  });
  return session
}

app.post('/create-checkout-session', async (req, res) => {

  var products = req.body.products;
  var soap_args = { distance: req.body.distance, weight: req.body.weight };

  //Calcul des frais de transport
  const fees = await getDeliveryFees(soap_args);
  products.push({ name: "Frais de livraison", amount: fees, quantity: 1, currency: 'eur' });

  console.log(products);

  //Creation de la session de paiement
  const session = await getCheckoutSession(products, req.headers.origin);

  res.json({ id: session.id });
});

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}!`));