(function() {
  // Payment Gateway JavaScript
  let currentStep = 1;
  let selectedFee = null;
  let selectedMethod = null;
  let paymentData = {};

  // DOM Elements
  const steps = document.querySelectorAll('.payment-step');
  const stepIndicators = document.querySelectorAll('.step');
  const progressFill = document.getElementById('progress-fill');
  const feeOptions = document.querySelectorAll('.fee-option');
  const paymentMethods = document.querySelectorAll('.payment-method');
  
  // Navigation buttons
  const nextStep1 = document.getElementById('next-step1');
  const nextStep2 = document.getElementById('next-step2');
  const backStep2 = document.getElementById('back-step2');
  const backStep3 = document.getElementById('back-step3');
  
  // Form elements
  const paymentForm = document.getElementById('paymentForm');
  const cardDetails = document.getElementById('cardDetails');
  const upiDetails = document.getElementById('upiDetails');
  const netbankingDetails = document.getElementById('netbankingDetails');
  
  // Receipt elements
  const finalReceipt = document.getElementById('finalReceipt');
  const downloadReceipt = document.getElementById('downloadReceipt');
  const printReceipt = document.getElementById('printReceipt');
  const newPayment = document.getElementById('newPayment');
  const transactionId = document.getElementById('transactionId');

  // Utility functions
  function getStore(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function appendLog(key, entry) {
    const list = getStore(key, []);
    list.push({
      time: new Date().toISOString(),
      ...entry
    });
    setStore(key, list);
  }

  function generateTransactionId() {
    return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function updateProgress() {
    const progress = (currentStep / 4) * 100;
    progressFill.style.width = progress + '%';
  }

  function updateStepIndicators() {
    stepIndicators.forEach((indicator, index) => {
      indicator.classList.remove('active', 'completed');
      if (index + 1 < currentStep) {
        indicator.classList.add('completed');
      } else if (index + 1 === currentStep) {
        indicator.classList.add('active');
      }
    });
  }

  function showStep(stepNumber) {
    steps.forEach((step, index) => {
      step.classList.remove('active');
      if (index + 1 === stepNumber) {
        step.classList.add('active');
      }
    });
    currentStep = stepNumber;
    updateProgress();
    updateStepIndicators();
  }

  function updatePreview() {
    if (selectedFee && paymentData.studentName) {
      document.getElementById('previewName').textContent = paymentData.studentName;
      document.getElementById('previewId').textContent = paymentData.studentId;
      document.getElementById('previewFeeType').textContent = selectedFee.type;
      document.getElementById('previewAmount').textContent = selectedFee.amount.toLocaleString();
      document.getElementById('previewMethod').textContent = selectedMethod.name;
      document.getElementById('previewDate').textContent = new Date().toLocaleDateString();
      document.getElementById('previewTotal').textContent = selectedFee.amount.toLocaleString();
      
      // Update UPI amount and description
      if (selectedMethod.type === 'upi') {
        document.getElementById('upiAmount').textContent = selectedFee.amount.toLocaleString();
        document.getElementById('upiDescription').textContent = selectedFee.type;
        
        const previewContainer = document.querySelector('.receipt-preview .receipt-details');
        let upiInfo = previewContainer.querySelector('.upi-info');
        if (!upiInfo) {
          upiInfo = document.createElement('p');
          upiInfo.className = 'upi-info';
          upiInfo.innerHTML = '<strong>Admin UPI ID:</strong> 7782891946@paytm';
          previewContainer.appendChild(upiInfo);
        }
      } else {
        const upiInfo = document.querySelector('.upi-info');
        if (upiInfo) {
          upiInfo.remove();
        }
      }
    }
  }

  function showPaymentMethodDetails(method) {
    // Hide all payment method details
    cardDetails.classList.add('hidden');
    upiDetails.classList.add('hidden');
    netbankingDetails.classList.add('hidden');
    
    // Show relevant details based on method
    switch (method) {
      case 'card':
        cardDetails.classList.remove('hidden');
        break;
      case 'upi':
        upiDetails.classList.remove('hidden');
        break;
      case 'netbanking':
        netbankingDetails.classList.remove('hidden');
        break;
    }
  }

  function generateReceiptHTML(data, status = 'completed') {
    const transactionId = generateTransactionId();
    const isPending = status === 'pending';
    const statusColor = isPending ? '#ffa500' : '#10b981';
    const statusText = isPending ? 'PENDING ADMIN CONFIRMATION' : 'PAID';
    
    return `
      <div class="receipt-header">
        <h2>GEC Hostel Payment Receipt</h2>
        <p>Government Engineering College, Samastipur</p>
        <p>Hostel Management System</p>
      </div>
      <div class="receipt-details">
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
        <hr style="margin: 15px 0;">
        <p><strong>Student Name:</strong> ${data.studentName}</p>
        <p><strong>Student ID:</strong> ${data.studentId}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <hr style="margin: 15px 0;">
        <p><strong>Fee Type:</strong> ${selectedFee.type}</p>
        <p><strong>Amount:</strong> ₹${selectedFee.amount.toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${selectedMethod.name}</p>
        ${selectedMethod.type === 'upi' ? '<p><strong>Admin UPI ID:</strong> 7782891946@paytm</p>' : ''}
        <hr style="margin: 15px 0;">
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        ${isPending ? '<p style="color: #ffa500; font-weight: bold;">⚠️ Complete UPI payment to admin and wait for confirmation</p>' : ''}
        <p><strong>Total Amount:</strong> ₹${selectedFee.amount.toLocaleString()}</p>
      </div>
      <div class="receipt-footer">
        <p>${isPending ? 'Payment initiated successfully!' : 'Thank you for your payment!'}</p>
        <p>This is a computer-generated receipt.</p>
        <p>For any queries, contact: hostel@gec.edu</p>
      </div>
    `;
  }

  function generatePDFReceipt(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(20);
    doc.text('GEC Hostel Payment Receipt', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Government Engineering College, Samastipur', 105, 30, { align: 'center' });
    doc.text('Hostel Management System', 105, 35, { align: 'center' });
    
    // Line separator
    doc.line(20, 40, 190, 40);
    
    // Transaction details
    doc.setFontSize(14);
    doc.text('Transaction Details:', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Transaction ID: ${generateTransactionId()}`, 20, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, 70);
    
    // Student details
    doc.setFontSize(14);
    doc.text('Student Information:', 20, 85);
    
    doc.setFontSize(10);
    doc.text(`Name: ${data.studentName}`, 20, 95);
    doc.text(`Student ID: ${data.studentId}`, 20, 100);
    doc.text(`Email: ${data.email}`, 20, 105);
    doc.text(`Phone: ${data.phone}`, 20, 110);
    
    // Payment details
    doc.setFontSize(14);
    doc.text('Payment Information:', 20, 125);
    
    doc.setFontSize(10);
    doc.text(`Fee Type: ${selectedFee.type}`, 20, 135);
    doc.text(`Amount: ₹${selectedFee.amount.toLocaleString()}`, 20, 140);
    doc.text(`Payment Method: ${selectedMethod.name}`, 20, 145);
    if(selectedMethod.type === 'upi'){
      doc.text(`Admin UPI ID: 7782891946@paytm`, 20, 150);
    }
    
    // Status
    doc.setFontSize(14);
    doc.text('Payment Status:', 20, 160);
    doc.setTextColor(0, 128, 0);
    doc.text('PAID', 20, 170);
    doc.setTextColor(0, 0, 0);
    
    // Total
    doc.setFontSize(16);
    doc.text(`Total Amount: ₹${selectedFee.amount.toLocaleString()}`, 20, 185);
    
    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, 200, { align: 'center' });
    doc.text('This is a computer-generated receipt.', 105, 205, { align: 'center' });
    doc.text('For queries: hostel@gec.edu', 105, 210, { align: 'center' });
    
    return doc;
  }

  // Event Listeners

  // Fee selection
  feeOptions.forEach(option => {
    option.addEventListener('click', () => {
      feeOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      
      selectedFee = {
        type: option.dataset.fee,
        amount: parseInt(option.dataset.amount),
        period: option.dataset.period
      };
      
      nextStep1.disabled = false;
    });
  });

  // Payment method selection
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.classList.remove('selected'));
      method.classList.add('selected');
      
      selectedMethod = {
        type: method.dataset.method,
        name: method.querySelector('h3').textContent
      };
      
      showPaymentMethodDetails(method.dataset.method);
      nextStep2.disabled = false;
    });
  });

  // Form input listeners for preview updates
  const formInputs = ['studentName', 'studentId', 'email', 'phone'];
  formInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', () => {
        paymentData[inputId] = input.value;
        updatePreview();
      });
    }
  });

  // Navigation
  nextStep1.addEventListener('click', () => {
    if (selectedFee) {
      showStep(2);
    }
  });

  nextStep2.addEventListener('click', () => {
    if (selectedMethod) {
      showStep(3);
    }
  });

  backStep2.addEventListener('click', () => {
    showStep(1);
  });

  backStep3.addEventListener('click', () => {
    showStep(2);
  });

  // Screenshot upload handling
  const paymentScreenshot = document.getElementById('paymentScreenshot');
  const screenshotPreview = document.getElementById('screenshotPreview');
  const screenshotFileName = document.getElementById('screenshotFileName');
  let screenshotData = null;

  if (paymentScreenshot) {
    paymentScreenshot.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          paymentScreenshot.value = '';
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          paymentScreenshot.value = '';
          return;
        }

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = (e) => {
          screenshotData = e.target.result;
          screenshotFileName.textContent = file.name;
          screenshotPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        screenshotData = null;
        screenshotPreview.style.display = 'none';
      }
    });
  }

  // Payment form submission
  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(paymentForm);
    paymentData = {
      studentName: document.getElementById('studentName').value,
      studentId: document.getElementById('studentId').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      cardNumber: document.getElementById('cardNumber')?.value || '',
      cardName: document.getElementById('cardName')?.value || '',
      expiryDate: document.getElementById('expiryDate')?.value || '',
      cvv: document.getElementById('cvv')?.value || '',
      upiId: document.getElementById('upiId')?.value || '',
      bankName: document.getElementById('bankName')?.value || ''
    };

    // Simulate payment processing
    const processingTime = 2000; // 2 seconds
    
    // Show loading state
    const submitBtn = paymentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing Payment...';
    submitBtn.disabled = true;

    setTimeout(() => {
      // Generate transaction ID
      const txnId = generateTransactionId();
      
      // Determine payment status based on method
      let paymentStatus = 'completed';
      
      if (selectedMethod.type === 'upi') {
        paymentStatus = 'pending';
      }
      
      // Store payment record
      const paymentRecord = {
        transactionId: txnId,
        studentName: paymentData.studentName,
        studentId: paymentData.studentId,
        email: paymentData.email,
        phone: paymentData.phone,
        feeType: selectedFee.type,
        amount: selectedFee.amount,
        paymentMethod: selectedMethod.name,
        status: paymentStatus,
        timestamp: new Date().toISOString(),
        adminUpiId: selectedMethod.type === 'upi' ? '7782891946@paytm' : null,
        screenshotUploaded: document.getElementById('paymentScreenshot')?.files.length > 0,
        screenshotData: screenshotData // Add screenshot data
      };

      // Log payment
      appendLog('payments', paymentRecord);
      appendLog('user_activity', {
        action: selectedMethod.type === 'upi' ? 'upi_payment_initiated' : 'payment_completed',
        transactionId: txnId,
        amount: selectedFee.amount,
        feeType: selectedFee.type,
        status: paymentStatus
      });

      // Generate receipt
      finalReceipt.innerHTML = generateReceiptHTML(paymentData, paymentStatus);
      transactionId.textContent = txnId;

      // Update status message
      const statusMessage = document.getElementById('paymentStatusMessage');
      if (selectedMethod.type === 'upi') {
        statusMessage.innerHTML = 'UPI payment initiated successfully! Please complete payment to <strong>7782891946@paytm</strong> and wait for admin confirmation.';
        statusMessage.style.color = '#ffa500';
      } else {
        statusMessage.textContent = 'Payment has been processed successfully. Receipt has been sent to your email.';
        statusMessage.style.color = '#10b981';
      }

      // Show success step
      showStep(4);
      
      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, processingTime);
  });

  // Receipt actions
  downloadReceipt.addEventListener('click', () => {
    const doc = generatePDFReceipt(paymentData);
    const fileName = `receipt_${paymentData.studentId}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    appendLog('user_activity', {
      action: 'receipt_downloaded',
      studentId: paymentData.studentId,
      transactionId: transactionId.textContent
    });
  });

  printReceipt.addEventListener('click', () => {
    const printWindow = window.open('', '_blank');
    const receiptHTML = `
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .receipt-details { margin: 10px 0; }
            .receipt-footer { border-top: 2px solid #333; padding-top: 10px; margin-top: 20px; text-align: center; }
            hr { margin: 15px 0; }
          </style>
        </head>
        <body>
          ${finalReceipt.innerHTML}
        </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
    
    appendLog('user_activity', {
      action: 'receipt_printed',
      studentId: paymentData.studentId,
      transactionId: transactionId.textContent
    });
  });

  newPayment.addEventListener('click', () => {
    // Reset form and go back to step 1
    paymentForm.reset();
    feeOptions.forEach(opt => opt.classList.remove('selected'));
    paymentMethods.forEach(m => m.classList.remove('selected'));
    
    // Hide all payment method details
    cardDetails.classList.add('hidden');
    upiDetails.classList.add('hidden');
    netbankingDetails.classList.add('hidden');
    
    // Reset data
    selectedFee = null;
    selectedMethod = null;
    paymentData = {};
    
    // Reset buttons
    nextStep1.disabled = true;
    nextStep2.disabled = true;
    
    // Go to first step
    showStep(1);
  });

  // Initialize
  updateProgress();
  updateStepIndicators();
  
  // Set current year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
