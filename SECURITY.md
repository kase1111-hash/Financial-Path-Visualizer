# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Data Privacy

Financial Path Visualizer is designed with privacy as a core principle:

- **Local-only storage**: All data is stored locally in your browser using IndexedDB
- **No server communication**: The application does not send data to any external servers
- **No third-party analytics**: No tracking or analytics services are included
- **No bank connections**: We do not connect to banks, brokerages, or financial services

Your financial data stays on your device.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainers directly or use GitHub's private vulnerability reporting feature
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity
- **Updates**: We will keep you informed of our progress
- **Resolution**: We aim to resolve critical vulnerabilities within 7 days

### Scope

The following are in scope for security reports:

- Cross-site scripting (XSS) vulnerabilities
- Data exposure or leakage issues
- Injection vulnerabilities
- Authentication/authorization issues (if applicable)
- Cryptographic issues
- Dependency vulnerabilities

### Out of Scope

- Issues in dependencies that don't affect this project
- Theoretical attacks without proof of concept
- Social engineering attacks
- Physical attacks

## Security Best Practices for Users

### Browser Security

- Keep your browser updated to the latest version
- Use a browser with good security features
- Be cautious with browser extensions that could access page data

### Data Backup

- Regularly export your financial profile using the built-in export feature
- Store exports securely (encrypted storage recommended)
- Don't share export files, as they contain your financial information

### General

- Don't use this application on shared or public computers
- Clear browser data after using on any computer you don't trust
- Be aware that browser developer tools can access IndexedDB data

## Security Measures

The application implements the following security measures:

- **Input sanitization**: All user inputs are sanitized before rendering
- **Safe DOM manipulation**: Using `textContent` instead of `innerHTML` where possible
- **Content Security Policy**: Recommended CSP headers for deployment
- **Dependency auditing**: Regular security audits of npm dependencies

## Acknowledgments

We thank the security researchers who help keep this project secure by responsibly disclosing vulnerabilities.
