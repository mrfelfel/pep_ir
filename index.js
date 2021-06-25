

// parse XML
const RSAXML = require('rsa-xml');

const crypto = require('crypto');
const axios = require("axios").default;
const { nanoid } = require('nanoid');
const moment = require('moment');



function encode(message, pk) {
    const xmlKey = pk;
    const pemKey = new RSAXML().exportPemKey(xmlKey);
    const sign = crypto.createSign('SHA1');
    sign.update(JSON.stringify(message));
    sign.end();
    const signature = sign.sign(pemKey);
    return signature.toString('base64');
}

class Pep {

    constructor(config = {
        pk: "",
        terminal: "",
        merchant: ""
    }) {

        this.config = config
    }


    async pay(info = {
        Amount: 0,
        CallbackURL: "",
        Mobile: "",
        Email: ""
    }) {


        try {

            const message = {
                InvoiceNumber: nanoid(),
                InvoiceDate: moment().format("YYYY-MM-DD-HH:MM:SS"),
                TerminalCode: this.config.terminal,
                MerchantCode: this.config.merchant,
                Amount: info.Amount,
                RedirectAddress: info.CallbackURL,
                Timestamp: moment().format("YYYY/MM/DD HH:MM:SS"),
                Action: 1003,
                Mobile: info.Mobile ? info.Mobile : undefined,
                Email: info.Email ? info.Email : undefined
            };
            const res = await axios.post('https://pep.shaparak.ir/Api/v1/Payment/GetToken', message, {
                headers: {
                    'content-type': 'text/json',
                    'sign': encode(message, this.config.pk)
                }
            });

            if (res.data.IsSuccess) {
                return Promise.resolve({
                    success: true,
                    token: res.data.Token,
                    invoice_number: message.InvoiceNumber,
                    amount: message.Amount,
                    link: "https://pep.shaparak.ir/payment.aspx?n=" + res.data.Token
                });
            } else {
                return Promise.reject({
                    success: false,
                    message: res.data.Message
                });

            }
        } catch (error) {
            throw error
        }
    }


    async checkWithTref(tref) {

        try {
            const message = {
                TransactionReferenceID: tref
            }
            const res = await axios.post('https://pep.shaparak.ir/Api/v1/Payment/CheckTransactionResult', message, {
                headers: {
                    'content-type': 'text/json',
                    'sign': encode(message, this.config.pk)
                }
            });

            return res.data;
        } catch (error) {
            throw error;
        }



    }


    async verify(info = {
        InvoiceNumber: "",
        InvoiceDate: "",
        Amount: 0
    }) {
        try {
            const message = {
                InvoiceNumber: info.InvoiceNumber,
                InvoiceDate: info.InvoiceDate,
                TerminalCode: this.config.terminal,
                MerchantCode: this.config.merchant,
                Amount: info.Amount,
                Timestamp: moment().format("YYYY/MM/DD HH:MM:SS"),
            }
            const res = await axios.post('https://pep.shaparak.ir/Api/v1/Payment/VerifyPayment', message, {
                headers: {
                    'content-type': 'text/json',
                    'sign': encode(message, this.config.pk)
                }
            });

            return res.data;
        } catch (error) {
            throw error;
        }
    }
}




module.exports = Pep