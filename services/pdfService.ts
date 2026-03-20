import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceOrder, Venda } from '../types';

export const generateSalePDF = (sale: Venda) => {
    const doc = new jsPDF('p', 'mm', 'a4'); // 80mm generic thermal not supported well in jspdf without custom size, sticking to A4 for now or custom small
    // Actually, for A4 print:
    let y = 10;

    // Helper colors
    const darkGray = [60, 60, 60] as [number, number, number];

    // --- HEADER ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KING CELULARES', 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rua Endereço Exemplo, 123', 105, y, { align: 'center' });
    y += 5;
    doc.text('Tel: (11) 99999-9999', 105, y, { align: 'center' });

    y += 10;
    doc.line(10, y, 200, y);
    y += 7;

    // --- SALE INFO ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE VENDA', 105, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: ${sale.numero_venda || 'N/A'}`, 15, y);
    doc.text(`Data: ${new Date(sale.created_at || new Date()).toLocaleString('pt-BR')}`, 130, y);
    y += 6;
    doc.text(`Cliente: ${sale.cliente_nome || 'Consumidor Final'}`, 15, y);
    y += 6;
    if (sale.cliente_telefone) {
        doc.text(`Telefone: ${sale.cliente_telefone}`, 15, y);
        y += 6;
    }

    y += 5;

    // --- ITEMS TABLE ---
    const headers = [['Item', 'Qtd', 'Unit.', 'Total']];
    const data = sale.itens?.map(item => [
        `${item.item_nome} ${item.variacao_nome ? `(${item.variacao_nome})` : ''}`,
        item.quantidade.toString(),
        `R$ ${item.preco_unitario.toFixed(2)}`,
        `R$ ${item.subtotal.toFixed(2)}`
    ]) || [];

    autoTable(doc, {
        startY: y,
        head: headers,
        body: data,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' }
        }
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // --- FINANCIALS ---
    const drawRow = (label: string, value: string, bold = false) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(label, 130, y);
        doc.text(value, 190, y, { align: 'right' });
        y += 5;
    };

    drawRow('Subtotal:', `R$ ${sale.subtotal.toFixed(2)}`);
    if (sale.desconto > 0) drawRow('Desconto:', `- R$ ${sale.desconto.toFixed(2)}`);
    if (sale.delivery_fee && sale.delivery_fee > 0) drawRow('Taxa Entrega:', `+ R$ ${sale.delivery_fee.toFixed(2)}`);

    y += 2;
    doc.line(130, y, 190, y);
    y += 5;
    drawRow('TOTAL:', `R$ ${sale.total.toFixed(2)}`, true);

    y += 10;

    // --- PAYMENT INFO ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Forma(s) de Pagamento:', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    sale.payment_details?.forEach(p => {
        const detail = `${p.method} ${p.installments ? `(${p.installments}x)` : ''}: R$ ${p.amount.toFixed(2)}`;
        doc.text(detail, 15, y);
        y += 5;
    });

    // --- FOOTER ---
    y += 20;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Obrigado pela preferência!', 105, y, { align: 'center' });
    y += 4;
    doc.text('Trocas somente com este comprovante e em até 7 dias.', 105, y, { align: 'center' });

    doc.save(`Recibo_Venda_${sale.numero_venda || 'NOVO'}.pdf`);
};

export const generatePDF = (order: ServiceOrder) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 10; // Vertical cursor

    // Helper colors
    const black = [0, 0, 0] as [number, number, number];
    const darkGray = [60, 60, 60] as [number, number, number];
    const lightGray = [240, 240, 240] as [number, number, number];

    // --- HEADER ---
    // Logo Area (Left)
    doc.setFillColor(255, 255, 255);
    doc.rect(10, y, 50, 25);
    // Placeholder Logo Art
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.roundedRect(12, y + 2, 8, 14, 1, 1); // Phone icon
    doc.circle(16, y + 13, 0.5); // Button
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KING', 24, y + 8);
    doc.setFontSize(10);
    doc.text('CELULARES', 24, y + 13);

    // Company Contact Info
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Rua Endereço Exemplo, 123', 24, y + 18);
    doc.text('(11) 99999-9999', 24, y + 22);

    // Center Title
    doc.setFontSize(22);
    doc.setTextColor(...darkGray);
    doc.text('ASSISTÊNCIA', 105, y + 10, { align: 'center' });
    doc.text('TÉCNICA', 105, y + 18, { align: 'center' });

    // Right OS Box
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Ordem de serviço', 160, y + 5);
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.roundedRect(160, y + 7, 40, 12, 2, 2);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Nº: ${order.osNumber.replace(/[^0-9]/g, '').slice(-4)}`, 180, y + 15, { align: 'center' });

    y += 35;

    // --- CLIENT INFO ---
    // Helper for lines
    const drawField = (label: string, value: string, x: number, lineY: number, width: number) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, lineY - 2);

        doc.setFont('helvetica', 'normal');
        if (value) doc.text(value, x + doc.getTextWidth(label) + 2, lineY - 2);

        doc.line(x + doc.getTextWidth(label) + 1, lineY, x + width, lineY);
    };

    doc.setLineWidth(0.1);
    drawField('Nome:', order.client.name, 10, y, 190);
    y += 8;
    drawField('RG/CPF:', order.client.cpf, 10, y, 90);
    drawField('Telefone:', order.client.phone, 110, y, 90);

    y += 10;

    // --- CHECKLIST ---
    // Header Bar
    doc.setFillColor(...darkGray);
    doc.rect(10, y, 190, 7, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Checklist', 15, y + 5);

    y += 8;

    // Checklist Data Preparation
    const checks = [
        { k: 'Tela/Display', v: order.checklist.display },
        { k: 'Touch Screen', v: order.checklist.touch },
        { k: 'Botões', v: order.checklist.buttons },
        { k: 'Sensores', v: order.checklist.proxSensor },
        { k: 'Câmeras', v: order.checklist.frontCamera }, // Logic needed if split
        { k: 'Wi-Fi/Bluetooth', v: order.checklist.wifi },
        { k: 'Sinal/Chip', v: order.checklist.signal },
        { k: 'Alto Falante', v: order.checklist.speaker },
        { k: 'Microfone', v: order.checklist.mic },
        { k: 'Conector Carga', v: order.checklist.connector },
        { k: 'Face ID', v: order.checklist.faceId },
        { k: 'Bateria', v: order.checklist.battery },
        { k: 'NFC', v: order.checklist.nfc },
        { k: 'Auricular', v: order.checklist.earpiece },
    ];

    // Custom Grid drawing to match "SIM [ ] NÃO [ ]" style
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    let colX = 10;
    let rowY = y;
    const colWidth = 95;
    const rowHeight = 6;

    checks.forEach((item, index) => {
        // Determine column
        if (index === Math.ceil(checks.length / 2)) {
            colX = 110;
            rowY = y;
        }

        // Striped background
        if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(colX, rowY, colWidth, rowHeight, 'F');
        }

        doc.text(item.k, colX + 2, rowY + 4);

        // Checkboxes
        // SIM
        doc.rect(colX + 50, rowY + 2, 3, 3);
        if (item.v === true) {
            doc.setFontSize(6);
            doc.text('X', colX + 50.5, rowY + 4.5);
            doc.setFontSize(8);
        }
        doc.text('SIM', colX + 54, rowY + 4.5);

        // NAO
        doc.rect(colX + 70, rowY + 2, 3, 3);
        if (item.v === false) {
            doc.setFontSize(6);
            doc.text('X', colX + 70.5, rowY + 4.5);
            doc.setFontSize(8);
        }
        doc.text('NÃO', colX + 74, rowY + 4.5);

        rowY += rowHeight;
    });

    y = rowY + 5; // Move cursor below checklist

    // --- DEVICE DETAILS ---
    drawField('IMEI:', order.device.imei, 10, y + 4, 80);

    // Password Field (Pattern removed)
    doc.text('Senha de desbloqueio:', 130, y);
    doc.line(130, y + 5, 190, y + 5);
    doc.setFontSize(10);
    doc.text(order.device.password || '', 135, y + 4);

    y += 10;
    drawField('Modelo:', `${order.device.brand} ${order.device.model} ${order.device.color}`, 10, y + 4, 80);

    y += 15;

    // --- DEVICE OUTLINES ---
    // Simple representation
    const drawPhoneOutline = (x: number, label: string) => {
        doc.roundedRect(x, y, 20, 38, 2, 2); // Body
        if (label === 'Frente') {
            doc.rect(x + 2, y + 3, 16, 28); // Screen
            doc.circle(x + 10, y + 35, 1.5); // Home
            doc.rect(x + 8, y + 1, 4, 0.5); // Earpiece
        } else if (label === 'Traseira') {
            doc.circle(x + 5, y + 5, 2); // Camera
            doc.roundedRect(x + 3, y + 10, 14, 2, 1, 1); // Logo area
        }
        doc.setFontSize(8);
        doc.text(label, x + 5, y + 42);
    };

    const drawSideOutline = (x: number, label: string) => {
        doc.roundedRect(x, y, 4, 38, 1, 1);
        // Buttons
        doc.rect(x - 0.5, y + 5, 0.5, 3, 'F');
        doc.rect(x - 0.5, y + 12, 0.5, 3, 'F');
        doc.setFontSize(8);
        doc.text(label, x - 2, y + 42);
    };

    drawPhoneOutline(30, 'Frente');
    drawPhoneOutline(60, 'Traseira');
    drawSideOutline(95, 'Lateral 1');
    drawSideOutline(115, 'Lateral 2'); // Spaced out

    // Simple outlines for Top/Bottom as horizontal bars
    doc.roundedRect(140, y + 10, 35, 4, 1, 1);
    doc.text('Superior', 150, y + 18);

    doc.roundedRect(140, y + 25, 35, 4, 1, 1);
    doc.text('Inferior', 150, y + 33);

    y += 50;

    // --- OBSERVATIONS ---
    const lineGap = 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Itens / Peças Adicionadas no serviço:', 10, y);
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.line(10, y + lineGap, 200, y + lineGap);
    doc.text(order.items || '', 12, y + lineGap - 1);
    y += lineGap;
    doc.line(10, y + lineGap, 200, y + lineGap);
    y += lineGap + 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Serviços a realizar / Problema relatado:', 10, y);
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.line(10, y + lineGap, 200, y + lineGap);
    const serviceText = order.services ? `Serviços: ${order.services}` : '';
    const problemText = order.problemReported ? `Defeito: ${order.problemReported}` : '';
    doc.text(`${serviceText} ${problemText}`, 12, y + lineGap - 1);
    y += lineGap;
    doc.line(10, y + lineGap, 200, y + lineGap);

    y += 15;

    // --- WARRANTY / FOOTER ---
    doc.setFillColor(230, 230, 230);
    doc.rect(10, y, 190, 20, 'F');
    doc.setFontSize(7);
    doc.setTextColor(50);
    const terms = [
        'A garantia do serviço executado é de 90 dias, a partir da data de entrega.',
        'A garantia NÃO cobre danos causados por quedas, líquidos, ou mau uso, nem aparelho aberto por terceiros.',
        'Em caso de transformação/troca de carcaça: o NFC pode ficar inativo.',
        'Ao assinar, o cliente concorda com os serviços listados e valores combinados.'
    ];
    let termY = y + 5;
    terms.forEach(t => {
        doc.text(t, 15, termY);
        termY += 4;
    });

    y += 30;

    // Signatures
    doc.setDrawColor(0);
    doc.line(10, y, 90, y);
    doc.text('Assinatura do Cliente', 10, y + 4);

    doc.line(110, y, 190, y);
    doc.text('Data: ___/___/___', 110, y + 4); // Date placeholder

    doc.save(`OS_${order.osNumber.replace(/[^a-zA-Z0-9]/g, '')}.pdf`);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR');
};

import { PurchaseOrder } from '../types';

export const generatePurchaseOrderPDF = (order: PurchaseOrder) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 10;

    const darkGray = [60, 60, 60] as [number, number, number];

    // --- HEADER ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KING CELULARES - IMPORTAÇÃO', 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rua Endereço Exemplo, 123 | Tel: (11) 99999-9999', 105, y, { align: 'center' });
    
    y += 10;
    doc.line(10, y, 200, y);
    y += 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE ENTRADA AVANÇADA / PURCHASE ORDER', 105, y, { align: 'center' });
    y += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fornecedor:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.supplier, 40, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Data:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(order.date), 155, y);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('ID do Pedido:', 15, y);
    doc.setFont('helvetica', 'normal');
    // Using a shorter hash if needed
    doc.text(order.id, 40, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Cotação Dólar:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`R$ ${order.usdQuote.toFixed(2)}`, 165, y);

    y += 10;

    // --- PRODUCTS TABLE ---
    const prodHeaders = [['Produto', 'Qtd', 'Val. Unit (USD)', 'Total (USD)', 'Custo Final (BRL)']];
    const prodData = order.products.map(p => [
        p.productName,
        p.quantity.toString(),
        `$ ${p.unitPriceUsd.toFixed(2)}`,
        `$ ${p.totalProductUsd.toFixed(2)}`,
        `R$ ${p.finalUnitCostBrl.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: y,
        head: prodHeaders,
        body: prodData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [40, 50, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' }
        }
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // --- PACKAGES TABLE ---
    if (order.packages && order.packages.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Tracking e Taxas (Pacotes)', 15, y);
        y += 5;

        const pkgHeaders = [['AliExpress ID', 'Taxa Aplicada (USD)']];
        const pkgData = order.packages.map(p => [
            p.aliexpressId || 'N/A',
            `$ ${p.taxUsd.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: y,
            head: pkgHeaders,
            body: pkgData,
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [100, 110, 120], textColor: [255, 255, 255] },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 40, halign: 'right' }
            }
        });

        // @ts-ignore
        y = doc.lastAutoTable.finalY + 10;
    }

    // --- FINANCIAL SUMMARY ---
    // Ensure we don't bleed off the page
    if (y > 240) {
        doc.addPage();
        y = 15;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, 180, 45, 'F');
    
    y += 8;
    doc.setFontSize(10);
    
    const drawLine = (label: string, value: string, bold = false) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(label, 20, y);
        doc.text(value, 185, y, { align: 'right' });
        y += 6;
    };

    const packageTaxes = order.packages?.reduce((acc, p) => acc + (p.taxUsd || 0), 0) || 0;

    drawLine('Soma dos Produtos (USD):', `$ ${(order.totalProductsUsd || 0).toFixed(2)}`);
    drawLine('Frete / Inbound (USD):', `$ ${(order.shippingUsd || 0).toFixed(2)}`);
    if (packageTaxes > 0) {
        drawLine('Taxas AliExpress / Correios (USD):', `$ ${packageTaxes.toFixed(2)}`);
    }
    if (order.factoryFeeUsd > 0) {
        drawLine('Fee Charge de Fábrica (USD):', `$ ${(order.factoryFeeUsd || 0).toFixed(2)}`);
    }
    
    y += 2;
    doc.line(20, y, 185, y);
    y += 6;

    doc.setFontSize(11);
    drawLine('VALOR TOTAL DO PEDIDO (USD):', `$ ${(order.totalOrderUsd || 0).toFixed(2)}`, true);
    
    doc.setTextColor(0, 100, 0);
    drawLine('ESTIMATIVA TOTAL (BRL):', `R$ ${((order.totalOrderUsd || 0) * order.usdQuote).toFixed(2)}`, true);
    doc.setTextColor(0, 0, 0);

    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento gerado automaticamente pelo ERP King Celulares.', 105, 280, { align: 'center' });

    doc.save(`Importacao_${order.date}_${order.supplier}.pdf`);
};
