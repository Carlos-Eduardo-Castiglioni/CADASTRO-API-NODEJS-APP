import React, { useState, useEffect } from 'react';  
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';  
import axios from 'axios';  
import AsyncStorage from '@react-native-async-storage/async-storage';

const CadastroScreen = () => {
  const [cpf, setCpf] = useState('');  
  const [cep, setCep] = useState('');
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [endereco, setEndereco] = useState('');  
  const [loading, setLoading] = useState(false);  
  const [cadastros, setCadastros] = useState([]);  
  const [isConsulting, setIsConsulting] = useState(false);  
  const [editingCadastro, setEditingCadastro] = useState(null); // Estado para armazenar o cadastro em edição

  // Carregar cadastros do AsyncStorage
  const loadCadastros = async () => {
    try {
      const response = await axios.get('http://172.16.7.5:3000/consultar');  // Busca os cadastros no banco
      setCadastros(response.data);  // Atualiza a lista de cadastros com os dados do banco
    } catch (error) {
      console.error("Erro ao carregar cadastros:", error);
    }
  };

  // Salvar cadastros no AsyncStorage
  const saveCadastros = async (cadastros) => {
    try {
      await AsyncStorage.setItem('cadastros', JSON.stringify(cadastros));
    } catch (error) {
      console.error("Erro ao salvar cadastros:", error);
    }
  };

  // Função para cadastrar um usuário
  const handleCadastro = async () => {
    if (!cpf || !nome || !idade || !cep || !endereco) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
  
    setLoading(true);
    try {
      if (editingCadastro) {
        // Atualiza o cadastro existente no banco de dados
        await axios.put(`http://172.16.7.5:3000/atualizar/${cpf}`, {
          cpf,
          nome,
          idade,
          endereco
        });
  
        Alert.alert('Sucesso', 'Cadastro atualizado com sucesso!');
      } else {
        // Cadastro novo no banco de dados
        await axios.post('http://172.16.7.5:3000/cadastrar', {
          cpf,
          nome,
          idade,
          endereco
        });
  
        Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      }
  
      setLoading(false);
  
      // Atualiza a lista de cadastros localmente após o cadastro
      const newCadastro = { cpf, nome, idade, endereco };
      const updatedCadastros = editingCadastro
        ? cadastros.map(cadastro =>
            cadastro.cpf === editingCadastro.cpf ? newCadastro : cadastro
          )
        : [...cadastros, newCadastro];
  
      setCadastros(updatedCadastros);
      saveCadastros(updatedCadastros);
  
      // Limpa os campos
      setCpf('');
      setNome('');
      setIdade('');
      setCep('');
      setEndereco('');
      setEditingCadastro(null); // Reseta o estado de edição
    } catch (error) {
      if (error.response) {
        // O servidor respondeu com um status diferente de 2xx
        console.error("Erro no cadastro:", error.response.data);
        Alert.alert('Erro', `Ocorreu um erro: ${error.response.data.message}`);
      } else if (error.request) {
        // A solicitação foi feita, mas nenhuma resposta foi recebida
        console.error("Erro no cadastro:", error.request);
        Alert.alert('Erro', 'Ocorreu um erro ao tentar se comunicar com o servidor.');
      } else {
        // Algo aconteceu ao configurar a solicitação que desencadeou um erro
        console.error("Erro no cadastro:", error.message);
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
      await axios.delete(`http://172.16.7.5:3000/excluir/${cpf}`);

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

  useEffect(() => {
    loadCadastros();  // Carrega os cadastros ao montar o componente
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
          onPress={handleCadastro}
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
        <View style={styles.cadastroList}>
          {cadastros.length > 0 ? (
            cadastros.map((cadastro, index) => (
              <View key={index} style={styles.cadastroItem}>
                <Text style={styles.cadastroText}>
                  {cadastro.nome} - {cadastro.cpf}
                </Text>
                <Button
                  title="Excluir"
                  onPress={() => handleDelete(cadastro.cpf)}
                  color="#ff0000"
                />
                <Button
                  title="Editar"
                  onPress={() => handleEdit(cadastro)}
                  color="#4CAF50"
                />
              </View>
            ))
          ) : (
            <Text style={styles.noCadastrosText}>Nenhum cadastro encontrado.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  loading: {
    marginVertical: 16,
  },
  divider: {
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  cadastroList: {
    marginTop: 20,
  },
  cadastroItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 5,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  cadastroText: {
    fontSize: 16,
    fontWeight: '500',
  },
  noCadastrosText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 10,
  }
});

export default CadastroScreen;
