import React, { useState } from 'react';
import { 
  Cloud, 
  Rocket, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  RotateCw, 
  Terminal, 
  X, 
  Sparkles,
  Server,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEPLOY_PROVIDERS, simulateDeployment } from '../services/serverlessDeployer';

export default function ServerlessDeploymentModal({
  isOpen,
  onClose,
  files = []
}) {
  const [selectedProvider, setSelectedProvider] = useState('vercel');
  const [projectName, setProjectName] = useState('elite-cloud-sandbox');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState([]);
  const [deployResult, setDeployResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const handleStartDeployment = async () => {
    setIsDeploying(true);
    setDeployLogs([]);
    setDeployResult(null);

    try {
      const res = await simulateDeployment({
        provider: selectedProvider,
        projectName,
        files,
        onLog: (msg) => setDeployLogs(prev => [...prev, msg])
      });
      setDeployResult(res);
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      setDeployLogs(prev => [...prev, `❌ Deployment failed: ${err.message}`]);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyUrl = () => {
    if (deployResult?.deploymentUrl) {
      navigator.clipboard.writeText(deployResult.deploymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container deploy-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge deploy-badge">
              <Rocket size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>One-Click Serverless Deployment</h2>
                <span className="s-tier-pill deploy-pill">Global Edge Cloud</span>
              </div>
              <p className="modal-subtitle">Publish full-stack projects directly to Vercel, Netlify, or AWS with zero configuration</p>
            </div>
          </div>
          <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="deploy-modal-body">
          {/* Provider Selection Cards */}
          <div className="deploy-providers-grid">
            {DEPLOY_PROVIDERS.map(p => (
              <div 
                key={p.id}
                className={`provider-card ${selectedProvider === p.id ? 'active-provider' : ''}`}
                onClick={() => !isDeploying && setSelectedProvider(p.id)}
              >
                <div className="provider-top">
                  <div className="provider-name">{p.name}</div>
                  <span className="provider-badge">{p.badge}</span>
                </div>
                <div className="provider-tagline">{p.tagline}</div>
              </div>
            ))}
          </div>

          {/* Project Details */}
          <div className="deploy-form-row">
            <div className="input-group">
              <label>Project Subdomain Name</label>
              <div className="subdomain-input-wrap">
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  disabled={isDeploying}
                  className="subdomain-input"
                />
                <span className="subdomain-suffix">
                  {selectedProvider === 'aws' ? '.execute-api.aws.com' : selectedProvider === 'netlify' ? '.netlify.app' : '.vercel.app'}
                </span>
              </div>
            </div>

            <button 
              className="start-deploy-btn"
              onClick={handleStartDeployment}
              disabled={isDeploying || !projectName.trim()}
            >
              {isDeploying ? (
                <>
                  <span className="spinner-mini" />
                  <span>Deploying to Edge...</span>
                </>
              ) : (
                <>
                  <Rocket size={15} />
                  <span>Deploy to {selectedProvider.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>

          {/* Build Terminal Stream */}
          {deployLogs.length > 0 && (
            <div className="deploy-build-terminal">
              <div className="terminal-top">
                <Terminal size={13} className="text-emerald-400" />
                <span>Edge Build Pipeline Stream ({selectedProvider.toUpperCase()})</span>
              </div>
              <div className="terminal-logs">
                {deployLogs.map((log, i) => (
                  <div key={i} className="log-line">{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Success Card */}
          {deployResult && (
            <div className="deploy-success-card">
              <div className="success-top">
                <div className="success-icon-wrap">
                  <Globe size={28} className="text-emerald-400" />
                </div>
                <div className="success-meta">
                  <div className="success-title">Project Successfully Deployed!</div>
                  <a 
                    href={deployResult.deploymentUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="deployed-link"
                  >
                    <span>{deployResult.deploymentUrl}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="success-stats-row">
                <div className="stat-pill">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>{deployResult.sslStatus}</span>
                </div>
                <div className="stat-pill">
                  <Server size={13} className="text-sky-400" />
                  <span>Region: {deployResult.region}</span>
                </div>
              </div>

              <div className="success-actions">
                <a 
                  href={deployResult.deploymentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="deploy-btn open-live-btn"
                >
                  <ExternalLink size={15} />
                  <span>Visit Live App</span>
                </a>
                <button className="deploy-btn copy-url-btn" onClick={handleCopyUrl}>
                  {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{copied ? 'Copied Link' : 'Copy Production URL'}</span>
                </button>
                <button 
                  className="deploy-btn qr-btn"
                  onClick={() => setShowQr(prev => !prev)}
                >
                  <QrCode size={15} />
                  <span>{showQr ? 'Hide Mobile QR' : 'Test on Phone (QR)'}</span>
                </button>
              </div>

              {showQr && (
                <div className="deploy-qr-modal">
                  <img src={deployResult.qrCodeUrl} alt="Mobile Deployment QR Code" className="qr-image" />
                  <p>Scan with your iPhone or Android camera to test live mobile responsiveness instantly.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
