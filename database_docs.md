# Documentação do Banco de Dados - Garagem Detail

Este documento descreve a estrutura do banco de dados planejada para o sistema.

## Tabelas

### 1. `clients` (Clientes)
Armazena os dados dos clientes que fazem agendamentos.
*   **id**: Identificador único.
*   **name**: Nome completo.
*   **phone**: Telefone (usado como chave única para identificar o cliente).

### 2. `services` (Serviços)
Lista de serviços oferecidos pela barbearia. Isso permite alterar preços e serviços sem mexer no código do site.
*   **name**: Ex: "Corte de Cabelo".
*   **price**: Valor atual.
*   **duration**: Tempo estimado em minutos.

### 3. `appointments` (Agendamentos)
O registro principal de um horário marcado.
*   **client_id**: Link para o cliente.
*   **appointment_date** / **appointment_time**: Quando será o serviço.
*   **status**: Se está Pendente, Confirmado, Concluído ou Cancelado.

### 4. `appointment_services`
Tabela de ligação, pois um agendamento pode ter vários serviços (ex: Corte + Barba).

### 5. `chat_messages` (Chat)
Histórico de mensagens.
*   **client_id**: De quem é a conversa.
*   **sender_type**: Quem enviou (Cliente, Barbeiro ou Sistema).
*   **message_text**: O conteúdo.

## Como usar
Este arquivo `.sql` pode ser importado em sistemas de banco de dados como MySQL ou PostgreSQL quando você desenvolver o backend.
