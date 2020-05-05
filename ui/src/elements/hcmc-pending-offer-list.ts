import { LitElement, html, property } from 'lit-element';
import { ApolloClient } from 'apollo-boost';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import '@material/mwc-list';
import '@authentic/mwc-circular-progress';

import { GET_PENDING_OFFERS } from '../graphql/queries';
import { Offer } from 'src/types';
import { sharedStyles } from './sharedStyles';
import { Agent } from 'holochain-profiles';

export class MCPendingOfferList extends moduleConnect(LitElement) {
  client!: ApolloClient<any>;

  @property({ type: String })
  myAgentId!: string;

  @property({ type: Object, attribute: false })
  offers!: Offer[];

  static get styles() {
    return sharedStyles;
  }

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);

    const result = await this.client.query({
      query: GET_PENDING_OFFERS,
      fetchPolicy: 'network-only',
    });

    this.myAgentId = result.data.me.id;
    this.offers = result.data.myOffers.filter((o) => o.state !== 'Completed');
  }

  renderPlaceholder(type: string) {
    return html`<span style="padding-top: 16px;"
      >You have no ${type.toLowerCase()} offers</span
    >`;
  }

  offerSelected(transactionId: string) {
    this.dispatchEvent(
      new CustomEvent('offer-selected', {
        detail: { transactionId, composed: true, bubbles: true },
      })
    );
  }

  getPendingOffers() {
    return this.offers.filter((offer) => offer.state !== 'Completed');
  }

  getOutgoing(): Offer[] {
    return this.offers.filter(
      (offer) => offer.transaction.debtor.id === this.myAgentId
    );
  }

  getIncoming(): Offer[] {
    return this.offers.filter(
      (offer) => offer.transaction.creditor.id === this.myAgentId
    );
  }

  counterparty(offer: Offer): Agent {
    return offer.transaction.creditor.id === this.myAgentId
      ? offer.transaction.debtor
      : offer.transaction.creditor;
  }

  renderOfferList(title: string, offers: Offer[]) {
    return html`<div class="column" style="margin-bottom: 24px;">
      <span class="title">${title} offers</span>

      ${offers.length === 0
        ? this.renderPlaceholder(title)
        : html`
            <mwc-list>
              ${offers.map(
                (offer) => html`
                  <mwc-list-item
                    @click=${() => this.offerSelected(offer.id)}
                    twoline
                  >
                    <span>
                      @${this.counterparty(offer).username}
                      ${offer.transaction.amount} credits
                    </span>
                    <span slot="secondary">
                      ${new Date(
                        offer.transaction.timestamp * 1000
                      ).toLocaleDateString()}
                    </span>
                  </mwc-list-item>
                `
              )}
            </mwc-list>
          `}
    </div>`;
  }

  render() {
    if (!this.offers)
      return html`<mwc-circular-progress></mwc-circular-progress>`;

    return html`<div class="column">
      ${this.renderOfferList('Incoming', this.getIncoming())}
      ${this.renderOfferList('Outgoing', this.getOutgoing())}
    </div>`;
  }
}
