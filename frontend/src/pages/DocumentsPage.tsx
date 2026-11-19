import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMedicalDocumentList, deleteMedicalDocument } from '../api';
import type { MedicalDocument } from '../types';
import { Alert, Section } from '../components/ui';
import DocumentsHeader from '../components/DocumentsHeader';
import DocumentsContent from '../components/DocumentsContent';
import DocumentUploadForm from '../components/DocumentUploadForm';

function DocumentsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }
    noticeTimer.current = setTimeout(() => setNotice(''), 2000);
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const list = await getMedicalDocumentList();
      setDocuments(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError('We could not load your documents. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    setLoading(true);
    loadDocuments();
  }, [authLoading, isAuthenticated, loadDocuments]);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  const handleUploaded = async () => {
    setShowForm(false);
    setActionError(null);
    await loadDocuments();
    flashNotice('Document uploaded');
  };

  const handleDelete = async (id: number) => {
    setActionError(null);
    try {
      await deleteMedicalDocument(id);
      setDocuments((prev) => (Array.isArray(prev) ? prev : []).filter((doc) => doc.id !== id));
      flashNotice('Document deleted');
    } catch (err) {
      setActionError('The document could not be deleted. Please try again.');
    }
  };

  const toggleForm = () => {
    setShowForm((prev) => !prev);
  };

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="ds-stack-lg">
      <DocumentsHeader
        section="Page header"
        page="DocumentsPage"
        documentCount={documents.length}
        onUploadClick={toggleForm}
      />
      {(notice || actionError) && (
        <Section tight narrow>
          {notice && <Alert tone="success">{notice}</Alert>}
          {actionError && <Alert tone="danger">{actionError}</Alert>}
        </Section>
      )}
      {showForm && (
        <Section
          tight
          narrow
          eyebrow="New upload"
          title="Add a document to your record"
          subtitle="Insurance cards and lab results in PDF, JPEG, PNG or WebP format, up to 10 MB."
        >
          <DocumentUploadForm onUploaded={handleUploaded} />
        </Section>
      )}
      <DocumentsContent
        documents={documents}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        onAddClick={() => setShowForm(true)}
      />
    </div>
  );
}

export default DocumentsPage;