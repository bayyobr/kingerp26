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
    doc.text('KING CARCAÇAS', 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rua Dias D\'Ávilla, 34 - Barra', 105, y, { align: 'center' });
    y += 5;
    doc.text('Tel: 71984303575', 105, y, { align: 'center' });

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

    if (sale.observacoes) {
        y += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Observações:', 15, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const splitObs = doc.splitTextToSize(sale.observacoes, 180);
        doc.text(splitObs, 15, y);
        y += splitObs.length * 4;
    }

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
    const primaryDark = [17, 17, 17] as [number, number, number]; // #111111
    const goldColor = [212, 160, 23] as [number, number, number]; // #D4A017
    const borderGray = [220, 220, 220] as [number, number, number];
    const textDark = [30, 30, 30] as [number, number, number];
    const textGray = [120, 120, 120] as [number, number, number];

    // Format Date helper
    const dateStr = formatDate(order.entryDate) || formatDate(new Date().toISOString());

    // --- HEADER (Dark #111111) ---
    doc.setFillColor(...primaryDark);
    doc.rect(10, y, 190, 24, 'F');

    // 1. Vector Logo: Crown + "KING CARCAÇAS" (White)
    doc.setFillColor(255, 255, 255);
    // Draw Crown
    doc.rect(15, y + 12, 10, 1.5, 'F'); // Crown base
    doc.triangle(15, y + 12, 17.5, y + 7, 20, y + 12, 'F'); // Left peak
    doc.triangle(20, y + 12, 22.5, y + 7, 25, y + 12, 'F'); // Right peak
    doc.triangle(17, y + 12, 20, y + 5, 23, y + 12, 'F'); // Center peak (taller)

    // Logo Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('KING', 28, y + 11);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CARCAÇAS', 28, y + 15);

    // Center Title "ORDEM DE SERVIÇO"
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ORDEM DE SERVIÇO', 105, y + 11, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Assistência Técnica em Eletrônicos', 105, y + 15, { align: 'center' });

    // Right Side (OS Number & Date)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.text('OS Nº', 185, y + 8, { align: 'right' });
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${order.osNumber.replace(/[^0-9]/g, '').slice(-4)}`, 185, y + 14, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(dateStr, 185, y + 19, { align: 'right' });

    y += 24;

    // Gold Divider Line (#D4A017)
    doc.setFillColor(...goldColor);
    doc.rect(10, y, 190, 1.2, 'F');

    y += 7;

    // Underline Input Field Helper
    const drawUnderlineField = (label: string, value: string, x: number, lineY: number, width: number) => {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textGray);
        doc.text(label.toUpperCase(), x, lineY - 2.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textDark);
        doc.setFontSize(8.5);
        if (value) {
            doc.text(value, x, lineY - 0.5);
        } else {
            doc.setTextColor(200, 200, 200);
            doc.text('--------------------------', x, lineY - 0.5);
        }

        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.2);
        doc.line(x, lineY, x + width, lineY);
    };

    // --- DADOS DO CLIENTE ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textGray);
    doc.text('DADOS DO CLIENTE', 10, y);
    y += 6;

    drawUnderlineField('Nome Completo', order.client.name, 10, y, 120);
    drawUnderlineField('Telefone', order.client.phone, 135, y, 65);
    y += 10;
    drawUnderlineField('RG / CPF', order.client.cpf, 10, y, 60);
    const clientEmail = (order.client as any).email || '';
    drawUnderlineField('E-Mail', clientEmail, 75, y, 125);

    y += 12;

    // --- DADOS DO APARELHO ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textGray);
    doc.text('DADOS DO APARELHO', 10, y);
    y += 6;

    drawUnderlineField('Modelo', `${order.device.brand} ${order.device.model} ${order.device.color}`, 10, y, 60);
    drawUnderlineField('IMEI', order.device.imei, 75, y, 60);
    drawUnderlineField('Senha de desbloqueio', order.device.password || '', 140, y, 60);

    y += 13;

    // --- CHECKLIST DE ENTRADA ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textGray);
    doc.text('CHECKLIST DE ENTRADA', 10, y);
    y += 4;

    const checks = [
        { label: 'Tela / Display', value: order.checklist.display },
        { label: 'Touch Screen', value: order.checklist.touch },
        { label: 'Botões', value: order.checklist.buttons },
        { label: 'Câmeras', value: order.checklist.frontCamera },
        { label: 'Wi-Fi / Bluetooth', value: order.checklist.wifi },
        { label: 'Sinal / Chip', value: order.checklist.signal },
        { label: 'Sensores', value: order.checklist.proxSensor },
        { label: 'Alto Falante', value: order.checklist.speaker },
        { label: 'Microfone', value: order.checklist.mic },
        { label: 'Conector de Carga', value: order.checklist.connector },
        { label: 'Face ID', value: order.checklist.faceId },
        { label: 'Bateria', value: order.checklist.battery },
        { label: 'NFC', value: order.checklist.nfc },
        { label: 'Auricular', value: order.checklist.earpiece },
    ];

    let colX = 10;
    let rowY = y;
    const colWidth = 90;
    const rowHeight = 6;

    checks.forEach((item, index) => {
        if (index === 7) {
            colX = 110;
            rowY = y;
        }

        // Draw dotted separator lines for alignment
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.15);
        doc.line(colX, rowY + rowHeight - 0.5, colX + colWidth, rowY + rowHeight - 0.5);

        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(item.label, colX, rowY + 3.8);

        // Chips
        const isSim = item.value === true;
        const isNao = item.value === false;

        // SIM Chip
        doc.setLineWidth(0);
        if (isSim) {
            doc.setFillColor(230, 244, 234); // Light green bg
            doc.roundedRect(colX + 63, rowY + 0.8, 11, 4, 0.8, 0.8, 'F');
            doc.setTextColor(19, 115, 51); // Dark green text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.text('SIM', colX + 68.5, rowY + 3.6, { align: 'center' });
        } else {
            doc.setFillColor(241, 243, 244); // Light gray bg
            doc.roundedRect(colX + 63, rowY + 0.8, 11, 4, 0.8, 0.8, 'F');
            doc.setTextColor(154, 160, 166); // Gray text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.text('SIM', colX + 68.5, rowY + 3.6, { align: 'center' });
        }

        // NÃO Chip
        if (isNao) {
            doc.setFillColor(252, 232, 230); // Light red bg
            doc.roundedRect(colX + 76, rowY + 0.8, 14, 4, 0.8, 0.8, 'F');
            doc.setTextColor(197, 34, 31); // Dark red text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.text('NÃO ✓', colX + 83, rowY + 3.6, { align: 'center' });
        } else {
            doc.setFillColor(241, 243, 244); // Light gray bg
            doc.roundedRect(colX + 76, rowY + 0.8, 14, 4, 0.8, 0.8, 'F');
            doc.setTextColor(154, 160, 166); // Gray text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.text('NÃO', colX + 83, rowY + 3.6, { align: 'center' });
        }

        rowY += rowHeight;
    });

    y = rowY + 6;

    // --- APARÊNCIA FÍSICA ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textGray);
    doc.text('APARÊNCIA FÍSICA', 10, y);
    y += 4;

    const drawPhoneOutline = (x: number, label: string) => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, 16, 28, 1.5, 1.5); // Body
        if (label === 'Frente') {
            doc.rect(x + 1.5, y + 2.5, 13, 21); // Screen
            doc.circle(x + 8, y + 25.5, 1.2); // Home button
            doc.rect(x + 6, y + 1, 4, 0.4); // Earpiece
        } else if (label === 'Traseira') {
            doc.circle(x + 4, y + 4, 1.5); // Camera
            doc.roundedRect(x + 2, y + 8, 12, 1.5, 0.8, 0.8); // Camera/Logo block
        } else if (label === 'Lateral 1' || label === 'Lateral 2') {
            doc.roundedRect(x, y, 3, 28, 0.8, 0.8); // Side view
            doc.rect(x - 0.3, y + 4, 0.3, 2, 'F');
            doc.rect(x - 0.3, y + 8, 0.3, 2, 'F');
        }
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(label, x + 8, y + 32, { align: 'center' });
    };

    drawPhoneOutline(15, 'Frente');
    drawPhoneOutline(38, 'Traseira');
    drawPhoneOutline(61, 'Lateral 1');
    drawPhoneOutline(75, 'Lateral 2');

    // Observation fields for Physical Appearance
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 120, 120);
    doc.text('Parte superior', 110, y + 3);
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(110, y + 5, 90, 8, 0.8, 0.8, 'FD');

    doc.text('Parte inferior', 110, y + 18);
    doc.roundedRect(110, y + 20, 90, 8, 0.8, 0.8, 'FD');

    y += 37;

    // --- ITENS / PEÇAS ADICIONADAS ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textGray);
    doc.text('ITENS / PEÇAS ADICIONADAS', 10, y);
    y += 4;

    // Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(10, y, 190, 6, 'F');
    doc.setDrawColor(230, 230, 230);
    doc.line(10, y, 200, y);
    doc.line(10, y + 6, 200, y + 6);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('QTD', 12, y + 4.2);
    doc.text('DESCRIÇÃO', 25, y + 4.2);
    doc.text('VALOR UNIT.', 170, y + 4.2, { align: 'right' });
    doc.text('TOTAL', 200, y + 4.2, { align: 'right' });

    y += 6;

    // Dynamic Items Parsing
    const parseItems = (itemsStr: string) => {
        if (!itemsStr) return [];
        const lines = itemsStr.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        return lines.map(line => {
            const match = line.match(/^(?:(\d+x?)\s+)?(.*?)(?:\s*-\s*R\$\s*([\d.,]+))?$/i);
            if (match) {
                let qty = match[1] || '1';
                if (!qty.endsWith('x')) qty += 'x';
                const desc = match[2].trim();
                const unitValNum = parseFloat((match[3] || '0').replace('.', '').replace(',', '.'));
                const qtyNum = parseInt(qty.replace('x', '')) || 1;
                const totalValNum = unitValNum * qtyNum;
                
                const formatBRL = (val: number) => {
                    return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                };

                return {
                    qty,
                    desc,
                    unitVal: formatBRL(unitValNum),
                    totalVal: formatBRL(totalValNum)
                };
            }
            return {
                qty: '1x',
                desc: line,
                unitVal: '-',
                totalVal: '-'
            };
        });
    };

    const parsedItems = parseItems(order.items || '');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);

    if (parsedItems.length === 0) {
        doc.text('-', 12, y + 4.5);
        doc.text('Nenhuma peça ou item adicionado.', 25, y + 4.5);
        doc.text('-', 170, y + 4.5, { align: 'right' });
        doc.text('-', 200, y + 4.5, { align: 'right' });
        y += 6;
    } else {
        parsedItems.forEach(item => {
            doc.text(item.qty, 12, y + 4.5);
            doc.text(item.desc, 25, y + 4.5);
            doc.setTextColor(19, 115, 51); // highlight item prices in green
            doc.text(item.unitVal, 170, y + 4.5, { align: 'right' });
            doc.text(item.totalVal, 200, y + 4.5, { align: 'right' });
            doc.setTextColor(...textDark);
            
            y += 6;
            doc.setDrawColor(245, 245, 245);
            doc.line(10, y, 200, y);
        });
    }

    // Total Row
    const formattedTotal = 'R$ ' + (order.priceTotal || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    doc.setFillColor(250, 250, 250);
    doc.rect(10, y, 190, 8, 'F');
    doc.setDrawColor(235, 235, 235);
    doc.line(10, y + 8, 200, y + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL', 160, y + 5, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(...textDark);
    doc.text(formattedTotal, 200, y + 5.5, { align: 'right' });

    y += 13;

    // --- DEFEITO / SERVIÇO A REALIZAR ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textGray);
    doc.text('DEFEITO / SERVIÇO A REALIZAR', 10, y);
    y += 4;

    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(10, y, 190, 12, 1, 1, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    const serviceText = order.services ? `Serviços: ${order.services}` : '';
    const problemText = order.problemReported ? `Defeito: ${order.problemReported}` : '';
    const combinedDescText = [serviceText, problemText].filter(Boolean).join(' | ') || 'Nenhum detalhe informado.';
    doc.text(combinedDescText, 13, y + 7.5);

    y += 18;

    // --- WARRANTY TERMS (Gold Left Border #D4A017) ---
    doc.setFillColor(250, 250, 250);
    doc.rect(10, y, 190, 22, 'F');
    doc.setFillColor(...goldColor);
    doc.rect(10, y, 1.2, 22, 'F'); // Gold Left Border

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');

    const terms = [
        '• A garantia do serviço executado é de 90 dias, a partir da data de entrega.',
        '• A garantia NÃO cobre danos causados por quedas, líquidos, ou mau uso, nem aparelho aberto por terceiros.',
        '• Em caso de transformação/troca de carcaça: o NFC pode ficar inativo.',
        '• Ao assinar, o cliente concorda com os serviços listados e valores combinados.'
    ];

    let termY = y + 4.5;
    terms.forEach(t => {
        // Highlight critical terms inside clauses
        if (t.includes('90 dias')) {
            doc.setFont('helvetica', 'bold');
        }
        doc.text(t, 14, termY);
        doc.setFont('helvetica', 'normal');
        termY += 4.2;
    });

    y += 33;

    // Signatures
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(10, y, 90, y);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Assinatura do Cliente', 10, y + 4);

    doc.line(110, y, 200, y);
    doc.text('Assinatura do Técnico / Data: ___/___/___', 110, y + 4);

    // --- DARK FOOTER (#111111) ---
    const footerY = 283;
    doc.setFillColor(...primaryDark);
    doc.rect(10, footerY, 190, 8, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    const part1 = "King Comércio e Serviços de Eletrônicos LTDA | CNPJ: ";
    const part2 = "52.174.512/0001-78";
    const part3 = " | Rua Dias D'Ávila, 34 - Barra, Salvador/BA | (71) 9884-303575";

    const w1 = doc.getTextWidth(part1);
    const w2 = doc.getTextWidth(part2);
    const w3 = doc.getTextWidth(part3);
    const totalW = w1 + w2 + w3;

    let startX = 105 - (totalW / 2);

    doc.setTextColor(255, 255, 255);
    doc.text(part1, startX, footerY + 5);
    startX += w1;

    doc.setTextColor(...goldColor); // Highlight CNPJ in Gold
    doc.setFont('helvetica', 'bold');
    doc.text(part2, startX, footerY + 5);
    startX += w2;

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(part3, startX, footerY + 5);

    doc.save(`OS_${order.osNumber.replace(/[^a-zA-Z0-9]/g, '')}.pdf`);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // If it's a date-only string like YYYY-MM-DD, format it directly to avoid timezone offsets
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
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
    doc.text('KING CARCAÇAS - IMPORTAÇÃO', 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rua Dias D\'Ávilla, 34 - Barra | Tel: 71984303575', 105, y, { align: 'center' });
    
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

        const pkgHeaders = [['AliExpress ID', 'Taxa Aplicada (BRL)']];
        const pkgData = order.packages.map(p => [
            p.aliexpressId || 'N/A',
            `R$ ${(p.taxBrl || 0).toFixed(2)}`
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

    const packageTaxesBrl = order.packages?.reduce((acc, p) => acc + (p.taxBrl || 0), 0) || 0;
    const extraBrl = (order.iofBrl || 0) + (order.factoryFeeBrl || 0) + packageTaxesBrl;

    drawLine('Soma dos Produtos (USD):', `$ ${(order.totalProductsUsd || 0).toFixed(2)}`);
    drawLine('IOF Gasto (BRL):', `R$ ${(order.iofBrl || 0).toFixed(2)}`);
    if (packageTaxesBrl > 0) {
        drawLine('Taxas AliExpress / Correios (BRL):', `R$ ${packageTaxesBrl.toFixed(2)}`);
    }
    if (order.factoryFeeBrl > 0) {
        drawLine('Fee Charge de Fábrica (BRL):', `R$ ${(order.factoryFeeBrl || 0).toFixed(2)}`);
    }
    
    y += 2;
    doc.line(20, y, 185, y);
    y += 6;

    doc.setFontSize(11);
    drawLine('VALOR TOTAL (USD):', `$ ${(order.totalOrderUsd || 0).toFixed(2)}`, true);
    
    doc.setTextColor(0, 100, 0);
    const totalEstimativaBrl = (order.totalOrderUsd || 0) * order.usdQuote + extraBrl;
    drawLine('ESTIMATIVA TOTAL (BRL):', `R$ ${totalEstimativaBrl.toFixed(2)}`, true);
    doc.setTextColor(0, 0, 0);

    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento gerado automaticamente pelo ERP King Celulares.', 105, 280, { align: 'center' });

    doc.save(`Importacao_${order.date}_${order.supplier}.pdf`);
};

export const generateSalesReportPDF = (sales: Venda[], startDate?: string, endDate?: string) => {
    // Exclude sales paid in cash ("Dinheiro") as requested
    const exportableSales = sales.filter(sale => sale.forma_pagamento !== 'Dinheiro');

    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 10;

    // Helper colors
    const primaryDark = [17, 17, 17] as [number, number, number];
    const accentBlue = [29, 78, 216] as [number, number, number];
    const textDark = [30, 30, 30] as [number, number, number];

    // --- HEADER PANEL ---
    doc.setFillColor(...primaryDark);
    doc.rect(10, y, 190, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('KING CARCAÇAS', 15, y + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text('Relatório de Pedidos de Venda - Contabilidade', 15, y + 14);

    // Period Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    const periodText = `Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Hoje'}`;
    doc.text(periodText, 195, y + 12, { align: 'right' });

    y += 20;

    // Accent line
    doc.setFillColor(...accentBlue);
    doc.rect(10, y, 190, 1, 'F');
    y += 8;

    // --- TABLE DATA ---
    const headers = [['Data', 'Nº Venda', 'Cliente', 'Vendedor', 'Descrição dos Itens (Qtd x Preço)', 'Pagamento', 'Total']];
    
    let grandTotal = 0;
    let totalDiscount = 0;

    const data = exportableSales.map(sale => {
        const saleTotal = (sale.total || 0) - (sale.delivery_fee || 0);
        grandTotal += saleTotal;
        totalDiscount += sale.desconto || 0;

        const dateStr = sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-BR') : '---';
        const saleNum = sale.numero_venda || '---';
        const clientName = sale.cliente_nome || 'Consumidor Final';
        const sellerName = sale.vendedor?.nome || 'Sem vendedor';
        
        const itemsStr = sale.itens?.map(item => {
            const name = item.item_nome + (item.variacao_nome ? ` (${item.variacao_nome})` : '');
            return `${item.quantidade}x ${name} (R$ ${item.preco_unitario.toFixed(2)})`;
        }).join('\n') || 'Sem itens';

        const payment = sale.forma_pagamento || 'N/A';
        const totalStr = `R$ ${saleTotal.toFixed(2)}`;

        return [
            dateStr,
            saleNum,
            clientName,
            sellerName,
            itemsStr,
            payment,
            totalStr
        ];
    });

    autoTable(doc, {
        startY: y,
        head: headers,
        body: data,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [40, 50, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 18 }, // Data
            1: { cellWidth: 18 }, // Nº Venda
            2: { cellWidth: 26 }, // Cliente
            3: { cellWidth: 26 }, // Vendedor
            4: { cellWidth: 52 }, // Descrição dos Itens
            5: { cellWidth: 22 }, // Pagamento
            6: { cellWidth: 28, halign: 'right' } // Total
        }
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 10;

    // Check if summaries fit in page
    if (y > 250) {
        doc.addPage();
        y = 15;
    }

    // --- SUMMARY BOX ---
    doc.setFillColor(245, 245, 245);
    doc.rect(10, y, 190, 25, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(10, y, 200, y);
    doc.line(10, y + 25, 200, y + 25);

    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(...textDark);
    
    // Summary row contents
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Pedidos:`, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${exportableSales.length}`, 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Descontos:`, 80, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`R$ ${totalDiscount.toFixed(2)}`, 110, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0);
    doc.text(`TOTAL GERAL:`, 140, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${grandTotal.toFixed(2)}`, 170, y);

    y += 8;
    doc.setTextColor(...textDark);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')} para fins de contabilidade e escrituração fiscal.`, 15, y);

    doc.save(`Relatorio_Contadora_${startDate || 'inicio'}_a_${endDate || 'fim'}.pdf`);
};
