import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Product } from '../types';
import { Alert, Button, Media } from './ui';

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  stock_quantity: number;
  requires_prescription: boolean;
  is_active: boolean;
  image?: File;
}

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ProductForm({ product, onSubmit, onCancel, submitting = false }: ProductFormProps) {
  const isEdit = Boolean(product);
  const [name, setName] = useState<string>(product?.name ?? '');
  const [slug, setSlug] = useState<string>(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState<boolean>(isEdit);
  const [description, setDescription] = useState<string>(product?.description ?? '');
  const [category, setCategory] = useState<string>(product?.category ?? '');
  const [price, setPrice] = useState<string>(product ? String(product.price) : '');
  const [stock, setStock] = useState<string>(product ? String(product.stock_quantity) : '0');
  const [requiresPrescription, setRequiresPrescription] = useState<boolean>(
    Boolean(product?.requires_prescription)
  );
  const [isActive, setIsActive] = useState<boolean>(product ? Boolean(product.is_active) : true);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setSlug(slugify(e.target.value));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    setFile(chosen);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const priceNumber = Number(price);
    const stockNumber = Number(stock);

    if (!name.trim()) {
      setError('Please enter the product name.');
      return;
    }
    if (price.trim() === '' || !Number.isFinite(priceNumber) || priceNumber < 0) {
      setError('Enter a valid price of zero or more.');
      return;
    }
    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      setError('Stock quantity must be a whole number of zero or more.');
      return;
    }

    const values: ProductFormValues = {
      name: name.trim(),
      slug: slug || slugify(name),
      description: description.trim(),
      category: category.trim(),
      price: Number(priceNumber || 0).toFixed(2),
      stock_quantity: stockNumber,
      requires_prescription: requiresPrescription,
      is_active: isActive,
    };
    if (file) values.image = file;

    void onSubmit(values);
  };

  const currentImage = previewUrl || (product?.image ? String(product.image) : '');

  return (
    <form className="ds-form" onSubmit={handleSubmit} noValidate>
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="product-name">Product name</label>
          <input
            id="product-name"
            className="input"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Ibuprofen 200 mg tablets"
            maxLength={200}
            required
          />
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="product-category">Category</label>
          <input
            id="product-category"
            className="input"
            type="text"
            value={category}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
            placeholder="e.g. Pain relief, Allergy, Vitamins"
            maxLength={100}
          />
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="product-slug">URL slug</label>
        <input
          id="product-slug"
          className="input"
          type="text"
          value={slug}
          onChange={handleSlugChange}
          placeholder="generated from the name"
        />
        <span className="ds-help">Used in the catalog address. Letters, numbers and dashes only.</span>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="product-description">Description</label>
        <textarea
          id="product-description"
          className="input"
          rows={4}
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Strength, pack size and general use shown to patients in the pharmacy catalog."
        />
      </div>

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="product-price">Price (USD)</label>
          <input
            id="product-price"
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="product-stock">Stock quantity</label>
          <input
            id="product-stock"
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={stock}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStock(e.target.value)}
            required
          />
          <span className="ds-help">Set to 0 to mark the item out of stock.</span>
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="product-image">Product photo</label>
        {currentImage && (
          <Media src={currentImage} alt={name || 'Product photo'} ratio="square" />
        )}
        <input
          id="product-image"
          className="input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <span className="ds-help">
          {isEdit ? 'Leave empty to keep the current photo.' : 'Optional. A clear photo of the packaging works best.'}
        </span>
      </div>

      <div className="ds-cluster">
        <label className="ds-cluster">
          <input
            type="checkbox"
            checked={requiresPrescription}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRequiresPrescription(e.target.checked)}
          />
          <span>Requires a prescription</span>
        </label>
        <label className="ds-cluster">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
          />
          <span>Visible in the catalog</span>
        </label>
      </div>

      <div className="ds-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;