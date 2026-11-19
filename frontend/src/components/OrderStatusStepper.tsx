import type { ComponentProps } from 'react';
import { Alert, Badge } from './ui';
import { Icon } from './icons';

type IconName = ComponentProps<typeof Icon>['name'];

interface OrderStatusStepperProps {
  status: string;
  fulfillmentMethod: string;
  orderType: string;
}

interface Step {
  key: string;
  label: string;
  hint: string;
  icon: IconName;
}

function buildSteps(fulfillmentMethod: string, orderType: string): Step[] {
  const isDelivery = fulfillmentMethod === 'delivery';
  const isPrescription = orderType === 'prescription';

  const steps: Step[] = [
    {
      key: 'pending_payment',
      label: 'Payment',
      hint: 'Pay securely online to send your order to the pharmacy.',
      icon: 'credit-card',
    },
    {
      key: 'received',
      label: 'Order received',
      hint: 'The pharmacy team has your order.',
      icon: 'check',
    },
  ];

  if (isPrescription) {
    steps.push({
      key: 'approved',
      label: 'Doctor approval',
      hint: 'Your prescribing doctor confirms the prescription.',
      icon: 'shield',
    });
  }

  steps.push({
    key: 'packed',
    label: isDelivery ? 'Packed' : 'Ready for pickup',
    hint: isDelivery
      ? 'Your medicines are packed and sealed.'
      : 'Collect your order from the Cedar Hollow pharmacy desk.',
    icon: 'package',
  });

  if (isDelivery) {
    steps.push({
      key: 'out_for_delivery',
      label: 'Out for delivery',
      hint: 'Your order is on its way to your address.',
      icon: 'truck',
    });
  }

  steps.push({
    key: 'delivered',
    label: isDelivery ? 'Delivered' : 'Collected',
    hint: isDelivery ? 'Your order has arrived.' : 'You have picked up your order.',
    icon: 'home',
  });

  return steps;
}

function OrderStatusStepper({ status, fulfillmentMethod, orderType }: OrderStatusStepperProps) {
  if (status === 'rejected' || status === 'cancelled') {
    return (
      <Alert tone="danger">
        {status === 'rejected'
          ? 'This order was not approved by the prescribing doctor. Please contact the clinic if you have questions.'
          : 'This order was cancelled.'}
      </Alert>
    );
  }

  const steps = buildSteps(fulfillmentMethod, orderType);
  const rawIndex = steps.findIndex((step) => step.key === status);
  // An unknown status (or "approved" on an OTC order) maps to the nearest earlier stage.
  const currentIndex = rawIndex >= 0 ? rawIndex : status === 'approved' ? steps.findIndex((s) => s.key === 'received') : 0;
  const allDone = steps[currentIndex]?.key === 'delivered';

  return (
    <div className="ds-stack" role="list" aria-label="Order progress">
      {(Array.isArray(steps) ? steps : []).map((step, index) => {
        const isDone = index < currentIndex || (allDone && index === currentIndex);
        const isCurrent = index === currentIndex && !allDone;
        const tone = isDone ? 'success' : isCurrent ? 'primary' : 'neutral';

        return (
          <div
            key={step.key}
            role="listitem"
            className="ds-cluster"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <Badge tone={tone}>
              <Icon name={isDone ? 'check' : step.icon} size={16} />
            </Badge>
            <div className="ds-stack">
              <div className="ds-cluster">
                <strong className={isDone || isCurrent ? undefined : 'ds-muted'}>{step.label}</strong>
                {isCurrent && <Badge tone="soft">Current step</Badge>}
              </div>
              {(isCurrent || index === currentIndex) && <span className="ds-small ds-muted">{step.hint}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default OrderStatusStepper;