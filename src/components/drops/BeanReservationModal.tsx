import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import type { Bean, BeanReservation } from '../../types/coffee';
import { catalogService } from '../../services/catalogService';
import { Modal, ModalHeader, Field, TextInput, TextArea, SelectInput, PrimaryButton, ErrorNote } from '../common/FormControls';

interface BeanReservationModalProps {
  bean: Bean | null;
  onClose: () => void;
  onReserved: (reservation: BeanReservation) => void;
}

/** Direct reservation: pre-order whole bean bags or drip packs from the roaster. */
export const BeanReservationModal: React.FC<BeanReservationModalProps> = ({ bean, onClose, onReserved }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [packType, setPackType] = useState<BeanReservation['packType']>('Whole Bean');
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const price = useMemo(() => {
    if (!bean) return 0;
    return packType === 'Whole Bean' ? bean.price : (bean.dripPackPrice ?? bean.price);
  }, [bean, packType]);

  if (!bean) return null;

  const submit = () => {
    try {
      const reservation = catalogService.createReservation({
        beanId: bean.id,
        beanName: bean.name,
        roasterId: bean.roasterId,
        roasterName: bean.roasterName,
        name: name.trim(),
        contact: contact.trim(),
        packType,
        quantity: Number(quantity),
        message: message.trim(),
      });
      setSent(true);
      onReserved(reservation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reservation failed. Check the fields and try again.');
    }
  };

  return (
    <Modal isOpen={Boolean(bean)} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="reserve-title">
      <ModalHeader
        title={sent ? 'Reservation sent' : 'Reserve fresh beans'}
        subtitle={sent ? undefined : `${bean.name} : ${bean.roasterName}`}
        onClose={onClose}
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {sent ? (
          <div className="space-y-3 text-center py-6">
            <span className="mx-auto h-14 w-14 rounded-full bg-[#3E5C48]/12 flex items-center justify-center">
              <Check className="w-7 h-7 text-[#3E5C48]" strokeWidth={2.5} />
            </span>
            <h3 className="ios-title">Your inquiry is in the roaster inbox.</h3>
            <p className="text-[15px] font-sans text-[#594C3D] leading-relaxed max-w-sm mx-auto">
              {bean.roasterName} will reach out on the contact you left. Reserve another lot or close this sheet.
            </p>
            <PrimaryButton onClick={onClose} className="w-full sm:w-auto sm:min-w-40">
              Done
            </PrimaryButton>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
              <Field label="Your name">
                <TextInput value={name} onChange={setName} placeholder="Juan de la Cruz" />
              </Field>
              <Field label="Contact" hint={`Messenger, Viber, or mobile. Shared only with ${bean.roasterName} for this order.`}>
                <TextInput value={contact} onChange={setContact} placeholder="0917 000 0000" />
              </Field>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] sm:grid-cols-2 gap-3">
              <Field label="Pack type">
                <SelectInput
                  value={packType}
                  onChange={(value) => setPackType(value as BeanReservation['packType'])}
                  options={[
                    { value: 'Whole Bean', label: `Whole bean 250g, ₱${bean.price}` },
                    ...(bean.dripPackPrice !== null
                      ? [{ value: 'Drip Pack', label: `Drip pack, ₱${bean.dripPackPrice}` }]
                      : []),
                  ]}
                />
              </Field>
              <Field label="Quantity" hint="1 to 20">
                <TextInput value={quantity} onChange={setQuantity} type="number" />
              </Field>
            </div>

            <Field label="Message to the roaster">
              <TextArea
                value={message}
                onChange={setMessage}
                rows={3}
                maxLength={400}
                placeholder="Pickup on Saturday after the cupping? Ask about grind size here."
              />
            </Field>

            <div className="ios-group bg-[#FAF5EB]">
              <div className="ios-group-row">
                <span className="text-[15px] font-sans text-[#13191F]">Estimated total</span>
                <span className="ml-auto font-mono text-[17px] font-semibold text-[#13191F]">₱{price * (Number(quantity) || 0)}</span>
              </div>
            </div>

            <p className="ios-footnote text-[#594C3D]">
              This is a request, not a purchase. {bean.roasterName} sells independently and confirms price, payment
              and pickup with you directly. See the{' '}
              <a href="#/tab/terms" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Terms</a> and{' '}
              <a href="#/tab/privacy" className="font-semibold text-[#7D5C3D] underline underline-offset-2">Privacy Notice</a>.
            </p>

            {error && <ErrorNote message={error} />}

            <PrimaryButton onClick={submit} className="w-full">
              <span className="block truncate">Send to {bean.roasterName}</span>
            </PrimaryButton>
            <p className="px-1 ios-footnote text-[#594C3D]">
              Reservations are direct inquiries with the roaster: payment and pickup are settled with them, not through Haraya.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};
