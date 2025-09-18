(function(){
  function getStore(key, fallback){
    try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){ return fallback; }
  }
  function setStore(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){} }
  function appendLog(key, entry){ const list=getStore(key, []); list.push({time:new Date().toISOString(), ...entry}); setStore(key, list); }
  const yearEl=document.getElementById('year');
  if(yearEl){yearEl.textContent=String(new Date().getFullYear());}

  // Notices
  const defaultNotices=[
    {id:1,text:'Admission for Semester VII hostel opens on 15th Sept.'},
    {id:2,text:'Mess will be closed on public holiday (19th Sept).'},
    {id:3,text:'Submit anti-ragging affidavit before 30th Sept.'}
  ];
  const notices=getStore('notices', defaultNotices);
  const noticeList=document.getElementById('noticeList');
  if(noticeList){
    notices.forEach(n=>{
      const li=document.createElement('li');
      li.textContent=n.text;
      noticeList.appendChild(li);
    });
  }

  // Rooms (mock)
  const floors=[1,2,3,4];
  const roomsDb=[];
  floors.forEach(floor=>{
    for(let i=1;i<=10;i++){
      const capacity=i%3===0?3:i%2===0?2:1;
      roomsDb.push({floor,room:`${floor}0${i}`,type:capacity===1?'single':capacity===2?'double':'triple',available:Math.random()>0.3});
    }
  });

  const floorSelect=document.getElementById('floorSelect');
  const roomTypeSelect=document.getElementById('roomTypeSelect');
  const roomResults=document.getElementById('roomResults');
  const bookingForm=document.getElementById('bookingForm');
  const selectedFloor=document.getElementById('selectedFloor');
  const selectedRoom=document.getElementById('selectedRoom');
  const cancelBooking=document.getElementById('cancelBooking');

  function populateFloors(){
    if(!floorSelect) return;
    floorSelect.innerHTML='';
    floors.forEach(f=>{
      const opt=document.createElement('option');
      opt.value=String(f);
      opt.textContent=`Floor ${f}`;
      floorSelect.appendChild(opt);
    });
  }

  function renderRooms(){
    if(!roomResults) return;
    roomResults.innerHTML='';
    const floor=Number(floorSelect?.value||floors[0]);
    const type=roomTypeSelect?.value||'any';
    const filtered=roomsDb.filter(r=>r.floor===floor && r.available && (type==='any'||r.type===type));
    appendLog('request_logs',{action:'filter_rooms', floor, type});
    if(filtered.length===0){
      const p=document.createElement('p');
      p.className='muted';
      p.textContent='No rooms available with current filters.';
      roomResults.appendChild(p);
      return;
    }
    filtered.forEach(r=>{
      const card=document.createElement('div');
      card.className='room-card';
      card.innerHTML=`<strong>Room ${r.room}</strong><br><span class="muted">Floor ${r.floor} • ${r.type}</span><br>`;
      const btn=document.createElement('button');
      btn.className='btn primary';
      btn.textContent='Book';
      btn.addEventListener('click',()=>startBooking(r));
      card.appendChild(btn);
      roomResults.appendChild(card);
    });
  }

  function startBooking(room){
    if(!bookingForm||!selectedFloor||!selectedRoom) return;
    selectedFloor.value=String(room.floor);
    selectedRoom.value=room.room;
    bookingForm.classList.remove('hidden');
    bookingForm.scrollIntoView({behavior:'smooth'});
    appendLog('user_activity',{action:'open_booking_form', room:room.room, floor:room.floor});
  }

  function finishBooking(evt){
    evt.preventDefault();
    const name=document.getElementById('studentName').value.trim();
    const id=document.getElementById('studentId').value.trim();
    if(!name||!id){alert('Please enter student details');return;}
    const room=selectedRoom.value;
    const rec=roomsDb.find(r=>r.room===room);
    if(rec){rec.available=false;}
    const booking={studentId:id, studentName:name, room, floor:selectedFloor.value};
    appendLog('bookings', booking);
    appendLog('request_logs',{action:'booking', ...booking});
    appendLog('user_activity',{action:'booking_success', room});
    alert(`Booking confirmed for ${name} (ID: ${id}) in room ${room}`);
    bookingForm.classList.add('hidden');
    renderRooms();
  }

  function cancelBookingForm(){
    if(!bookingForm) return;
    bookingForm.classList.add('hidden');
  }

  if(floorSelect){
    populateFloors();
    renderRooms();
    floorSelect.addEventListener('change',renderRooms);
  }
  if(roomTypeSelect){ roomTypeSelect.addEventListener('change',renderRooms); }
  if(bookingForm){ bookingForm.addEventListener('submit',finishBooking); }
  if(cancelBooking){ cancelBooking.addEventListener('click',cancelBookingForm); }

  // Student login (mock)
  const studentLoginForm=document.getElementById('studentLoginForm');
  const studentLoginMsg=document.getElementById('studentLoginMsg');
  if(studentLoginForm){
    studentLoginForm.addEventListener('submit',function(e){
      e.preventDefault();
      const sid=document.getElementById('loginStudentId').value.trim();
      const pwd=document.getElementById('loginPassword').value.trim();
      const success = Boolean(sid && pwd==='student');
      appendLog('login_activity',{studentId:sid||null, success});
      appendLog('sign_in_logs',{studentId:sid||null, success});
      if(success){studentLoginMsg.textContent='Login successful.';studentLoginMsg.style.color='#10b981';}
      else{studentLoginMsg.textContent='Invalid credentials. Hint: password is "student"';studentLoginMsg.style.color='#ef4444';}
    });
  }

  // Fees (mock)
  const messFeesAmount=document.getElementById('messFeesAmount');
  const hostelFeesList=document.getElementById('hostelFeesList');
  const fees=getStore('fees', {mess:'₹ 3,500 / month', single:'₹ 18,000 / year', double:'₹ 15,000 / year', triple:'₹ 15,000 / year'});
  if(messFeesAmount){ messFeesAmount.textContent=fees.mess; }
  if(hostelFeesList){
    const items=[
      {label:'Room (Single)',amount:fees.single},
      {label:'Room (Double)',amount:fees.double},
      {label:'Room (Triple)',amount:fees.triple},
      {label:'Security Deposit (refundable)',amount:'₹ 5,000'}
    ];
    items.forEach(i=>{
      const li=document.createElement('li');
      li.innerHTML=`<strong>${i.label}</strong> — <span class="muted">${i.amount}</span>`;
      hostelFeesList.appendChild(li);
    });
  }

  // i-Complain (mock)
  const complainForm=document.getElementById('complainForm');
  const complainMsg=document.getElementById('complainMsg');
  if(complainForm){
    complainForm.addEventListener('submit',function(e){
      e.preventDefault();
      const ticket = Math.floor(Math.random()*90000+10000);
      appendLog('request_logs',{action:'complaint', ticket});
      appendLog('user_activity',{action:'complaint_submitted', ticket});
      complainMsg.textContent='Your complaint has been submitted. Ticket: #' + ticket;
      complainMsg.style.color='#10b981';
      complainForm.reset();
    });
  }
})();

