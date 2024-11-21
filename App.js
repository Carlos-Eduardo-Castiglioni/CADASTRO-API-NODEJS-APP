import React, { useState, useEffect } from 'react';  
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';  
import axios from 'axios';  
import AsyncStorage from '@react-native-async-storage/async-storage';

const CadastroScreen = () => {
  // Definindo os estados para os campos do formulário e funcionalidades auxiliares
  const [cpf, setCpf] = useState('');  
  const [cep, setCep] = useState('');
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [endereco, setEndereco] = useState('');  
  const [loading, setLoading] = useState(false);  
  const [cadastros, setCadastros] = useState([]);  
  const [isConsulting, setIsConsulting] = useState(false);  
  const [editingCadastro, setEditingCadastro] = useState(null); // Estado para armazenar o cadastro em edição

  // Função para carregar cadastros do banco de dados
  const loadCadastros = async () => {
    try {
      const response = await axios.get('http://192.168.15.11:3000/consultar');  // Busca os cadastros no banco
      setCadastros(response.data);  // Atualiza a lista de cadastros com os dados do banco
    } catch (error) {
      console.error("Erro ao carregar cadastros:", error);
    }
  };

  // Função para salvar cadastros no AsyncStorage (opcional, caso precise de armazenamento local)
  const saveCadastros = async (cadastros) => {
    try {
      await AsyncStorage.setItem('cadastros', JSON.stringify(cadastros));
    } catch (error) {
      console.error("Erro ao salvar cadastros:", error);
    }
  };

  // Função para cadastrar um novo usuário
  const handleCadastro = async () => {
    // Verifica se todos os campos estão preenchidos
    if (!cpf || !nome || !idade || !cep || !endereco) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
  
    setLoading(true);
    try {
      // Cadastro novo no banco de dados
      await axios.post('http://192.168.15.11:3000/cadastrar', {
        cpf,
        nome,
        idade,
        endereco
      });
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
  
      setLoading(false);
  
      // Atualiza a lista de cadastros localmente após o cadastro
      const newCadastro = { cpf, nome, idade, endereco };
      const updatedCadastros = [...cadastros, newCadastro];
  
      setCadastros(updatedCadastros);
      saveCadastros(updatedCadastros); // Salva no AsyncStorage
  
      // Limpa os campos
      setCpf('');
      setNome('');
      setIdade('');
      setCep('');
      setEndereco('');
    } catch (error) {
      // Lida com diferentes tipos de erros
      if (error.response) {
        console.error("Erro no cadastro:", error.response.data);
        Alert.alert('Erro', `Ocorreu um erro: ${error.response.data.message}`);
      } else if (error.request) {
        console.error("Erro no cadastro:", error.request);
        Alert.alert('Erro', 'Ocorreu um erro ao tentar se comunicar com o servidor.');
      } else {
        console.error("Erro no cadastro:", error.message);
        Alert.alert('Erro', `Erro desconhecido: ${error.message}`);
      }
      setLoading(false);
    }
  };

  // Função para atualizar um cadastro existente
  const handleAtualizar = async () => {
    // Verifica se todos os campos estão preenchidos
    if (!nome || !idade || !endereco) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
  
    setLoading(true);
    try {
      // Atualiza o cadastro no banco de dados
      await axios.put(`http://192.168.15.11:3000/atualizar/${cpf}`, {
        nome,
        idade,
        endereco
      });
      Alert.alert('Sucesso', 'Cadastro atualizado com sucesso!');
  
      setLoading(false);
  
      // Atualiza a lista de cadastros localmente após a atualização
      const updatedCadastros = cadastros.map(cadastro =>
        cadastro.cpf === cpf ? { ...cadastro, nome, idade, endereco } : cadastro
      );
  
      setCadastros(updatedCadastros);
      saveCadastros(updatedCadastros);  // Salva no AsyncStorage
  
      // Limpa os campos
      setCpf('');
      setNome('');
      setIdade('');
      setCep('');
      setEndereco('');
      setEditingCadastro(null); // Reseta o estado de edição
    } catch (error) {
      // Lida com diferentes tipos de erros
      if (error.response) {
        console.error("Erro ao atualizar cadastro:", error.response.data);
        Alert.alert('Erro', `Ocorreu um erro: ${error.response.data.message}`);
      } else if (error.request) {
        console.error("Erro ao atualizar cadastro:", error.request);
        Alert.alert('Erro', 'Ocorreu um erro ao tentar se comunicar com o servidor.');
      } else {
        console.error("Erro ao atualizar cadastro:", error.message);
        Alert.alert('Erro', `Erro desconhecido: ${error.message}`);
      }
      setLoading(false);
    }
  };

  // Função para buscar o endereço automaticamente com base no CEP
  const buscarEnderecoPorCep = async (cep) => {
    setLoading(true);  
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (response.data.erro) {
        Alert.alert('Erro', 'CEP não encontrado.');
        setEndereco('');
      } else {
        const { logradouro, bairro, localidade, uf } = response.data;
        setEndereco(`${logradouro}, ${bairro}, ${localidade} - ${uf}`);
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao buscar o endereço.');
      setEndereco('');
      setLoading(false);
    }
  };

  // Função para lidar com a mudança de CEP no campo de entrada
  const handleCepChange = (cep) => {
    setCep(cep); 
    if (cep.length === 8) {
      buscarEnderecoPorCep(cep);  
    }
  };

  // Função para consultar todos os cadastros já realizados
  const consultarCadastros = async () => {
    setIsConsulting(true);  
    loadCadastros();  // Carrega os cadastros diretamente do banco
    setIsConsulting(false);
  };

  // Função para excluir um cadastro
  const handleDelete = async (cpf) => {
    setLoading(true);  
    try {
      // Exclui o cadastro do banco de dados
      await axios.delete(`http://192.168.15.11:3000/excluir/${cpf}`);

      // Atualiza a lista de cadastros após a exclusão
      const updatedCadastros = cadastros.filter(cadastro => cadastro.cpf !== cpf);
      setCadastros(updatedCadastros);
      saveCadastros(updatedCadastros);  // Atualiza o AsyncStorage

      Alert.alert('Sucesso', 'Cadastro excluído com sucesso!');
      setLoading(false);
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao excluir o cadastro.');
      setLoading(false);
    }
  };

  // Função para editar um cadastro
  const handleEdit = (cadastro) => {
    setCpf(cadastro.cpf);
    setNome(cadastro.nome);
    setIdade(cadastro.idade);
    setEndereco(cadastro.endereco);
    setCep(cadastro.cep);
    setEditingCadastro(cadastro); // Marca o cadastro como em edição
  };

  // Função para cancelar a edição de um cadastro
  const handleCancelEdit = () => {
    // Limpa os campos e reseta o estado de edição
    setCpf('');
    setNome('');
    setIdade('');
    setCep('');
    setEndereco('');
    setEditingCadastro(null);
  };

  // Carrega os cadastros ao montar o componente
  useEffect(() => {
    loadCadastros();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{editingCadastro ? 'Editar Cadastro' : 'Cadastro de Usuários'}</Text>

      {/* Campos de entrada */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={cpf}
          onChangeText={setCpf}
          placeholder="Digite o CPF"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={cep}
          onChangeText={handleCepChange}
          placeholder="Digite o CEP"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={endereco}
          placeholder="Endereço"
          editable={false}
        />
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Digite o nome"
        />
        <TextInput
          style={styles.input}
          value={idade}
          onChangeText={setIdade}
          placeholder="Digite a idade"
          keyboardType="numeric"
        />

        <Button
          title={loading ? 'Cadastrando...' : editingCadastro ? 'Atualizar' : 'Cadastrar'}
          onPress={editingCadastro ? handleAtualizar : handleCadastro}
          disabled={loading}
        />
        
        {editingCadastro && (
          <Button
            title="Cancelar"
            onPress={handleCancelEdit}
            color="#ff0000"
            style={styles.cancelButton}
          />
        )}
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />}

      <View style={styles.divider} />

      <TouchableOpacity style={styles.button} onPress={consultarCadastros}>
        <Text style={styles.buttonText}>Consultar Cadastros</Text>
      </TouchableOpacity>

      {isConsulting ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
      ) : (
        <View style={styles.cadastrosContainer}>
          {cadastros.map((cadastro) => (
            <View key={cadastro.cpf} style={styles.cadastroItem}>
              <Text>CPF: {cadastro.cpf}</Text>
              <Text>Nome: {cadastro.nome}</Text>
              <Text>Idade: {cadastro.idade}</Text>
              <Text>Endereço: {cadastro.endereco}</Text>
              <Button title="Editar" onPress={() => handleEdit(cadastro)} />
              <Button title="Excluir" onPress={() => handleDelete(cadastro.cpf)} color="#ff0000" />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  cadastrosContainer: {
    marginTop: 20,
  },
  cadastroItem: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
  },
  loading: {
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'gray',
    marginVertical: 20,
  },
  cancelButton: {
    marginTop: 10,
  },
});

export default CadastroScreen;
