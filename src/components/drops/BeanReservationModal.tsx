import React, { useMemo, useState } from 'react';
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
        title={sent ? 'Reservation Sent' : 'Reserve Fresh Beans'}
        subtitle={sent ? undefined : `${bean.name} : ${bean.roasterName}`}
        onClose={onClose}
      />

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {sent ? (
          <div className="space-y-3 text-center py-6">
            <span className="mx-auto h-12 w-12 rounded-full bg-[#3E5C48]/15 border border-[#3E5C48]/30 flex items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-[#3E5C48]" />
            </span>
            <h3 className="font-cooper text-lg font-bold text-[#1A2225]">Your inquiry is in the roaster inbox.</h3>
            <p className="text-xs font-sans text-[#55615D]">
              {bean.roasterName} will reach out on the contact you left. Reserve another lot or close this sheet.
            </p>
            <PrimaryButton onClick={onClose} className="w-full sm:w-auto">
              Done
            </PrimaryButton>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Your Name">
                <TextInput value={name} onChange={setName} placeholder="Juan de la Cruz" />
              </Field>
              <Field label="Contact" hint="Messenger, Viber, or mobile">
                <TextInput value={contact} onChange={setContact} placeholder="0917 000 0000" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Pack Type">
                <SelectInput
                  value={packType}
                  onChange={(value) => setPackType(value as BeanReservation['packType'])}
                  options={[
                    { value: 'Whole Bean', label: `Whole Bean 250g : P${bean.price}` },
                    ...(bean.dripPackPrice !== null
                      ? [{ value: 'Drip Pack', label: `Drip Pack : P${bean.dripPackPrice}` }]
                      : []),
                  ]}
                />
              </Field>
              <Field label="Quantity" hint="1 to 20">
                <TextInput value={quantity} onChange={setQuantity} type="number" />
              </Field>
            </div>

            <Field label="Message to the Roaster">
              <TextArea
                value={message}
                onChange={setMessage}
                rows={3}
                maxLength={400}
                placeholder="Pickup on Saturday after the cupping? Ask about grind size here."
              />
            </Field>

            <div className="flex items-center justify-between rounded-xl bg-[#F3ECD8] border border-[#E6DCC0] px-3 py-2.5">
              <span className="text-xs font-sans text-[#55615D]">Estimated total</span>
              <span className="font-cooper text-lg font-bold text-[#1A2225]">P{price * (Number(quantity) || 0)}</span>
            </div>

            {error && <ErrorNote message={error} />}

            <PrimaryButton onClick={submit} className="w-full">
              Send Reservation to {bean.roasterName}
            </PrimaryButton>
            <p className="text-[10px] font-sans text-[#55615D] leading-relaxed">
              Reservations are direct inquiries with the roaster: payment and pickup are settled with them, not through Haraya.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};
