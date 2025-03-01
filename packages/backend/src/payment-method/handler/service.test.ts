import { PaymentMethodHandlerService, StartQuoteOptions } from './service'
import { initIocContainer } from '../../'
import { createTestApp, TestContainer } from '../../tests/app'
import { Config } from '../../config/app'
import { IocContract } from '@adonisjs/fold'
import { AppServices } from '../../app'
import { createAsset } from '../../tests/asset'
import { createPaymentPointer } from '../../tests/paymentPointer'

import { createReceiver } from '../../tests/receiver'
import { IlpPaymentService } from '../ilp/service'
import { truncateTables } from '../../tests/tableManager'

describe('PaymentMethodHandlerService', (): void => {
  let deps: IocContract<AppServices>
  let appContainer: TestContainer
  let paymentMethodHandlerService: PaymentMethodHandlerService
  let ilpPaymentService: IlpPaymentService

  beforeAll(async (): Promise<void> => {
    deps = initIocContainer(Config)
    appContainer = await createTestApp(deps)

    paymentMethodHandlerService = await deps.use('paymentMethodHandlerService')
    ilpPaymentService = await deps.use('ilpPaymentService')
  })

  afterEach(async (): Promise<void> => {
    jest.restoreAllMocks()
    await truncateTables(appContainer.knex)
  })

  afterAll(async (): Promise<void> => {
    await appContainer.shutdown()
  })

  describe('getQuote', (): void => {
    test('calls ilpPaymentService for ILP payment type', async (): Promise<void> => {
      const asset = await createAsset(deps)
      const paymentPointer = await createPaymentPointer(deps, {
        assetId: asset.id
      })

      const options: StartQuoteOptions = {
        paymentPointer,
        receiver: await createReceiver(deps, paymentPointer),
        debitAmount: {
          assetCode: 'USD',
          assetScale: 2,
          value: 100n
        }
      }

      const ilpPaymentServiceGetQuoteSpy = jest.spyOn(
        ilpPaymentService,
        'getQuote'
      )

      await paymentMethodHandlerService.getQuote('ILP', options)

      expect(ilpPaymentServiceGetQuoteSpy).toHaveBeenCalledWith(options)
    })
  })
})
