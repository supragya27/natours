import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51HBHUABygQSV2pCOGTA3ykCuDbEO3BzK5w85IiA9yGq8nJ40Tf37Nk9Bcm4tBmVRlGebJl22IfV8jSSiDIbAnazw00Q4edJZKD');

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
