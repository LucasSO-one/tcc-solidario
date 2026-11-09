using System.ComponentModel.DataAnnotations;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging.Abstractions;
using TccSolidario.Api.Controllers;
using TccSolidario.Api.DTOs.Ong;
using TccSolidario.Api.Services;

var total=0;
void Check(bool condition,string name){if(!condition)throw new Exception(name);total++;Console.WriteLine("PASSOU: "+name);}
async Task<(bool Valid,int Requests)> Consultar(string cnpj, HttpStatusCode status=HttpStatusCode.OK,string json="{\"descricao_situacao_cadastral\":\"ATIVA\"}",bool offline=false){
    var handler=new ProvedorSimulado(_=>offline?throw new HttpRequestException("serviço simulado indisponível"):new HttpResponseMessage(status){Content=new StringContent(json)});
    using var client=new HttpClient(handler);
    var service=new CnpjValidatorService(client,NullLogger<CnpjValidatorService>.Instance);
    return(await service.ValidarCnpjAtivoAsync(cnpj),handler.Requests);
}
foreach(var value in new[]{"00000000000000","11111111111111","11222333000182","","AB123456000100"}){
    var result=await Consultar(value);Check(!result.Valid&&result.Requests==0,"CNPJ inválido não é aprovado nem consulta provedor: "+value);
}
Check((await Consultar("11.222.333/0001-81")).Valid,"consulta ativa normaliza a máscara");
Check(!(await Consultar("11222333000181",json:"{\"descricao_situacao_cadastral\":\"BAIXADA\"}")).Valid,"cadastro inativo recusado");
Check(!(await Consultar("11222333000181",json:"{\"descricao_situacao_cadastral\":null}")).Valid,"situação ausente não aprova cadastro");
Check(!(await Consultar("11222333000181",json:"resposta inválida")).Valid,"resposta inválida não aprova cadastro");
Check(!(await Consultar("11222333000181",status:HttpStatusCode.ServiceUnavailable)).Valid,"indisponibilidade HTTP não aprova cadastro");
Check(!(await Consultar("11222333000181",offline:true)).Valid,"falha de rede não aprova cadastro");
RegistroOngRequest Cadastro(string telefone)=>new(){NomeFantasia="Instituição QA",Cnpj="11222333000181",Email="cadastro-qa@example.invalid",Senha="SomenteTeste!42",Telefone=telefone};
foreach(var telefone in new[]{"123","11300000000","1190000000"}){
    var dto=Cadastro(telefone);var errors=new List<ValidationResult>();
    Check(!Validator.TryValidateObject(dto,new ValidationContext(dto),errors,true)&&errors.Any(e=>e.MemberNames.Contains("Telefone")),"DTO ONG rejeita celular inválido: "+telefone);
}
var valid=Cadastro("(11) 90000-0000");Check(Validator.TryValidateObject(valid,new ValidationContext(valid),[],true)&&valid.Telefone=="11900000000","DTO ONG aceita e normaliza celular válido");
Check(typeof(CnpjController).GetCustomAttributes(typeof(AuthorizeAttribute),true).Cast<AuthorizeAttribute>().Any(a=>a.Roles=="Admin"),"diagnóstico de CNPJ exige administrador");
Console.WriteLine($"RESULTADO: {total} verificações de cadastro aprovadas, sem serviços externos.");
sealed class ProvedorSimulado(Func<HttpRequestMessage,HttpResponseMessage> responder):HttpMessageHandler{
    public int Requests {get;private set;}
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,CancellationToken cancellationToken){Requests++;return Task.FromResult(responder(request));}
}
