import jsPDF from 'jspdf';
import { Aparelho, Venda, Vendedor } from '../types';

export const generateDeviceTermPDF = (venda: Venda, item: Aparelho, vendedor?: Vendedor) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    let y = 10;

    // Helper colors
    const darkGray = [60, 60, 60] as [number, number, number];
    const white = [255, 255, 255] as [number, number, number];

    // Helper for underlined fields
    const drawField = (label: string, value: string, x: number, lineY: number, width: number) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, lineY - 2);

        doc.setFont('helvetica', 'normal');
        if (value) doc.text(String(value), x + doc.getTextWidth(label) + 2, lineY - 2);

        doc.setLineWidth(0.1);
        doc.line(x + doc.getTextWidth(label) + 1, lineY, x + width, lineY);
    };

    // Helper for section headers
    const drawSectionHeader = (title: string, currentY: number) => {
        doc.setFillColor(...darkGray);
        doc.rect(margin, currentY, 180, 7, 'F');
        doc.setTextColor(...white);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 5, currentY + 5);
        doc.setTextColor(0);
        return currentY + 12;
    };

    // --- HEADER ---
    // Logo Area (Left)
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, 8, 14, 1, 1); // Phone icon
    doc.circle(margin + 4, y + 11, 0.5); // Button
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KING', margin + 12, y + 6);
    doc.setFontSize(10);
    doc.text('CARCAÇAS', margin + 12, y + 11);

    // Company Contact Info
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Rua Dias D\'Ávila, 34 - Barra', margin + 12, y + 16);
    doc.text('(71) 98430-3575', margin + 12, y + 20);

    // Center Title
    doc.setFontSize(20);
    doc.setTextColor(...darkGray);
    doc.text('TERMO DE', 105, y + 8, { align: 'center' });
    doc.text('COMPRA E VENDA', 105, y + 16, { align: 'center' });
    doc.setTextColor(0);

    // Right Sale Box
    doc.setFontSize(9);
    doc.text('Comprovante de Venda', 155, y + 5);
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.roundedRect(155, y + 7, 40, 12, 2, 2);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Nº: ${venda.numero_venda?.slice(-5) || '0000'}`, 175, y + 15, { align: 'center' });

    y += 30;

    // --- SALE INFO ---
    drawField('Data da Venda:', new Date(venda.created_at || new Date()).toLocaleDateString('pt-BR'), margin, y, 90);
    drawField('Vendedor:', vendedor?.nome || 'Sistema', 105, y, 90);

    y += 12;

    // --- BUYER INFO ---
    y = drawSectionHeader('DADOS DO COMPRADOR', y);
    drawField('Nome:', venda.cliente_nome || 'N/A', margin, y, 180);
    y += 8;
    drawField('CPF / RG:', venda.cliente_cpf || 'N/A', margin, y, 90);
    drawField('Telefone:', venda.cliente_telefone || 'N/A', 105, y, 90);

    y += 15;

    // --- DEVICE INFO ---
    y = drawSectionHeader('DADOS DO APARELHO', y);
    drawField('Marca/Modelo:', `${item.marca} ${item.modelo}`, margin, y, 110);
    drawField('Condição:', item.condicao, 125, y, 70);
    y += 8;
    drawField('Capacidade:', item.capacidade, margin, y, 60);
    drawField('Cor:', item.cor, 75, y, 55);
    drawField('Bateria:', `${item.estado_bateria}%`, 130, y, 65);
    y += 8;
    drawField('IMEI 1:', item.imei, margin, y, 90);
    drawField('IMEI 2:', item.imei2 || '-', 105, y, 90);

    y += 15;

    // --- VALUES INFO ---
    y = drawSectionHeader('VALORES E PAGAMENTO', y);

    // 1. Device Value
    const itemPrice = item.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    drawField('Valor do Aparelho:', itemPrice, margin, y, 90);

    // 2. Other Items (if any)
    const otherItems = (venda.itens || (venda as any).items || []).filter((i: any) => i.item_id !== item.id);
    const otherItemsTotal = otherItems.reduce((acc: number, i: any) => acc + i.subtotal, 0);

    let otherItemsValue = otherItemsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (otherItems.length === 1) {
        // If it's just one item (like 'Carcaça'), include its name
        otherItemsValue = `${otherItems[0].item_nome}: ${otherItemsValue}`;
    } else if (otherItems.length > 1) {
        otherItemsValue = `${otherItems.length} itens (${otherItemsValue})`;
    }
    drawField('Outros Itens:', otherItemsValue, 105, y, 90);

    y += 8;

    // 3. Discount
    const discountText = (venda.desconto || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    drawField('Desconto:', discountText, margin, y, 90);

    // 4. Payment Method
    let paymentMethodText = venda.forma_pagamento;
    if (venda.forma_pagamento === 'Múltiplo' && venda.payment_details && venda.payment_details.length > 0) {
        // Show unique methods joined by ' e '
        const methods = [...new Set(venda.payment_details.map(p => p.method))];
        paymentMethodText = methods.join(' e ');
    }
    drawField('Forma de Pagamento:', paymentMethodText, 105, y, 90);


    y += 10;

    // 5. Total
    const totalText = venda.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAGO:', margin, y - 2);
    doc.setFontSize(14);
    doc.text(totalText, margin + 28, y - 2);
    drawField('', '', margin + 27, y, 63); // underline for total

    // If there are other items, list them briefly
    if (otherItems.length > 0) {
        y += 8;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        const itemsList = otherItems.map((i: any) => `${i.quantidade}x ${i.item_nome}`).join(', ');
        doc.text(`Itens adicionais: ${itemsList}`, margin, y);
    }

    y += 15;


    // --- WARRANTY SECTION ---
    y = drawSectionHeader('GARANTIA E CONDIÇÕES', y);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const warrantyTerms = [
        '1. O prazo de garantia para este aparelho é de 90 dias a contar da data desta venda.',
        '2. A garantia NÃO cobre danos por queda, contato com líquidos, quebras físicas ou mau uso.',
        '3. A garantia será invalidada caso o aparelho seja aberto ou reparado por terceiros.',
        '4. O aparelho deve ser devolvido nas mesmas condições estéticas em que foi entregue.',
        '5. É obrigatória a apresentação deste termo original para qualquer solicitação de garantia.'
    ];
    warrantyTerms.forEach(term => {
        doc.text(term, margin + 2, y + 4);
        y += 5;
    });

    y += 10;
    // --- DECLARATION ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DECLARAÇÃO DE RECEBIMENTO', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const declaration = "Declaro que recebi o aparelho acima descrito em perfeitas condições de funcionamento e estética, conferindo todos os itens mencionados, e estou plenamente ciente das condições de garantia descritas neste termo.";
    const splitDec = doc.splitTextToSize(declaration, 180);
    doc.text(splitDec, margin, y + 5);
    y += 15;

    // --- SIGNATURES ---
    y += 20;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin + 10, y, margin + 80, y);
    doc.line(margin + 100, y, margin + 170, y);

    doc.setFontSize(8);
    doc.text('Assinatura do Comprador', margin + 45, y + 4, { align: 'center' });
    doc.text('King Carcaças (Vendedor)', margin + 135, y + 4, { align: 'center' });

    y += 12;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('* Este documento é a sua prova de compra e garantia. Guarde-o com cuidado.', 105, y, { align: 'center' });

    // Save PDF
    const filename = `Termo_${item.modelo.replace(/\s+/g, '_')}_${venda.numero_venda?.replace('#', '') || 'venda'}.pdf`;
    doc.save(filename);
};
