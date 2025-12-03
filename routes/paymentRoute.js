const express = require('express');
const paypal = require('paypal-rest-sdk');
const User = require('../models/user');

const paymentRouter = express.Router();

// configuration
paypal.configure({
    mode: 'sandbox', // change to live for production
    client_id: 'YOUR_PAYPAL_CLIENT_ID',
    client_secret: 'YOUR_PAYPAL_SECRET',
});

// handles form submission from topup.html
paymentRouter.post('/create-payment', async (req, res) => {
    try {
        const { amount, gateway } = req.body;
        const user = req.session.user;

        if (!user) return res.redirect('/login');
        if (!amount) {
            req.flash('error', 'Please Enter amount.');
            return res.redirect('/topup');
        }

        const totalAmount = parseFloat(amount);

        // --- OPTION A: PAYPAL ---
        if (gateway === 'paypal') {
            const create_payment_json = {
                intent: "sale",
                payer: { "payment_method": "paypal" },
                redirect_urls: {
                    return_url: `${req.protocol}://${req.get('host')}/payment/success?amount=${totalAmount}&gateway=paypal`,
                    cancel_url: `${req.protocol}://${req.get('host')}/topup`,
                },
                transactions: [{
                    item_list: {
                        items: [{
                            name: "Wallet Top-up",
                            sku: "001",
                            price: totalAmount.toString(),
                            currency: "USD",
                            quantity: 1,
                        }]
                    },
                    amount: {
                        currency: "USD",
                        total: totalAmount.toString(),
                    },
                    description: "Wallet funds for Tutorsonhenry"
                }]
            }
        };

        // --- OPTION B: PAYSTACK (VISA/MASTERCARD)
        // To be added later

        paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                throw error;
            } else {
                // find the approval URL to redirect user
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        return res.redirect(payment.links[i].href);
                    }
                }
            }
        });

    } catch (err) {
        console.error("Payment Error:", err);
        req.flash('error', 'Payment initialization failed.');
        res.redirect('/topup');
    }
});

// SUCCESS ROUTE (Adds money to wallet)
// In production - use webhooks for security
// simplfied version for demonstration
paymentRouter.get('/payment/success', async (req, res) => {
    try {
        const { amount, gateway, paymentId, PayerID } = req.query;
        const user = req.session.user;

        if (!user) return res.redirect('/login');

        // handle PayPal execution
        if (gateway === 'paypal') {
            const execute_payment_json = { payer_id: PayerID };
            // wrap the SDK in a promise to await it
            await new Promise((resolve, reject) => {
                paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
                    if (error) reject(error);
                    else resolve(payment);
                });
            });
        }

        // UPDATE DATABASE: Add funds to user wallet
        // Ensure your User model has a 'walletBalance' field (Number)
        await User.findByIdAndUpdate(user.id, {
            $inc: { walletBalance: parseFloat(amount) }
        });

        // update session so the header updates immediately
        req.session.user.walletBalance = (req.session.user.walletBalance || 0) + parseFloat(amount);

        req.flash('success', `Successfully added $${amount} to your wallet!`);
        res.redirect('/profile');

    } catch (err) {
        console.error(err);
        req.flash('error', 'Transaction failed or cancelled.');
        res.redirect('/topup');
    }
});

module.exports = paymentRouter;
