use super::ChainSnapshot;
use crate::{message::OfferResponse, offer, offer::OfferState, utils};
use hdk::prelude::*;

/*** Sender of the offer returns the list of private transactions if the offer is still pending ***/

/**
 * Get the transaction snapshot if the offer is still pending
 */
pub fn get_chain_snapshot(
    sender_address: Address,
    transaction_address: Address,
) -> ZomeApiResult<OfferResponse<ChainSnapshot>> {
    let offer = offer::query_offer(&transaction_address)?;

    if offer.transaction.debtor_address != sender_address
        && offer.transaction.creditor_address != sender_address
    {
        return Err(ZomeApiError::from(format!(
            "The sender of the message is neither the debtor nor the creditor of the transaction"
        )));
    }

    match offer.state {
        OfferState::Pending => {
            let transaction_snapshot = get_my_chain_snapshot()?;

            return Ok(OfferResponse::OfferPending(transaction_snapshot));
        }
        OfferState::Completed {
            attestation_address,
        } => Ok(OfferResponse::OfferCompleted(attestation_address)),
        OfferState::Canceled => Ok(OfferResponse::OfferCanceled),
    }
}

/**
 * Get the list of transactions and the last header from the source chain
 */
pub fn get_my_chain_snapshot() -> ZomeApiResult<ChainSnapshot> {
    let last_header = utils::get_my_last_header()?;
    let snapshot = utils::query_all(String::from("*"))?;

    Ok(ChainSnapshot {
        last_header_address: last_header.address(),
        snapshot,
    })
}
