import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Appointment, Product } from '../types';
import { Button, Alert } from './ui';
import { Icon } from './icons';

interface PrescriptionFormData {
  patient: number;
  doctor: number;
  appointment: number;
  product: number | null;
  medicine_name: string;
  dosage: string;
  instructions: string;
  notes: string;
  refills_allowed: number;
}

interface PrescriptionFormProps {
  appointment: Appointment;
  products: Product[];
  onSubmit: (data: PrescriptionFormData) => void | Promise<void>;
  submitting: boolean;
}

function PrescriptionForm({ appointment, products, onSubmit, submitting }: PrescriptionFormProps) {
  const [productId, setProductId] = useState<string>('');
  const [medicineName, setMedicineName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [refills, setRefills] = useState<string>('0');
  const [error, setError] = useState<string>('');

  const productList: Product[] = Array.isArray(products)
    ? products.filter((p) => p.is_active !== false)
    : [];

  const handleProductChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProductId(value);
    if (value) {
      const selected = productList.find((p) => String(p.id) === value);
      if (selected && !medicineName.trim()) {
        setMedicineName(selected.name);
      }
    }
  };

  const resetForm = () => {
    setProductId('');
    setMedicineName('');
    setDosage('');
    setInstructions('');
    setNotes('');
    setRefills('0');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!medicineName.trim() || !dosage.trim() || !instructions.trim()) {
      setError('Medicine name, dosage and instructions are required.');
      return;
    }
    const refillCount = Math.max(0, parseInt(refills, 10) || 0);
    try {
      await onSubmit({
        patient: appointment.patient as unknown as number,
        doctor: appointment.doctor as unknown as number,
        appointment: appointment.id as unknown as number,
        product: productId ? Number(productId) : null,
        medicine_name: medicineName.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim(),
        notes: notes.trim(),
        refills_allowed: refillCount,
      });
      resetForm();
    } catch (err) {
      setError('The prescription could not be saved. Please try again.');
    }
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit}>
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="ds-field">
        <label className="ds-label" htmlFor="rx-product">Pharmacy product</label>
        <select
          id="rx-product"
          className="input"
          value={productId}
          onChange={handleProductChange}
        >
          <option value="">Not linked to a pharmacy product</option>
          {productList.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}{p.requires_prescription ? ' (prescription only)' : ''}
            </option>
          ))}
        </select>
        <span className="ds-help">
          Linking a product lets the patient order this medicine from the Cedar Hollow pharmacy.
        </span>
      </div>

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="rx-medicine">Medicine name</label>
          <input
            id="rx-medicine"
            className="input"
            type="text"
            maxLength={200}
            value={medicineName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMedicineName(e.target.value)}
            placeholder="e.g. Amoxicillin 500mg capsules"
            required
          />
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="rx-dosage">Dosage</label>
          <input
            id="rx-dosage"
            className="input"
            type="text"
            maxLength={100}
            value={dosage}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDosage(e.target.value)}
            placeholder="e.g. 1 capsule, three times daily"
            required
          />
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="rx-instructions">Instructions for the patient</label>
        <textarea
          id="rx-instructions"
          className="input"
          rows={3}
          value={instructions}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInstructions(e.target.value)}
          placeholder="Take with food. Complete the full course even if symptoms improve."
          required
        />
      </div>

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="rx-refills">Refills allowed</label>
          <input
            id="rx-refills"
            className="input"
            type="number"
            min={0}
            max={12}
            value={refills}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRefills(e.target.value)}
          />
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="rx-notes">Internal notes (optional)</label>
          <input
            id="rx-notes"
            className="input"
            type="text"
            value={notes}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
            placeholder="Allergies checked, pharmacist remarks"
          />
        </div>
      </div>

      <div className="ds-form-actions">
        <Button type="submit" variant="primary" disabled={submitting}>
          <Icon name="plus" size={16} />
          {submitting ? 'Saving prescription...' : 'Add prescription'}
        </Button>
      </div>
    </form>
  );
}

export default PrescriptionForm;